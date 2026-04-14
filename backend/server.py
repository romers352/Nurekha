from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import secrets
import bcrypt
import jwt
import httpx
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from bson import ObjectId

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_ALGORITHM = "HS256"
MAX_LOGIN_ATTEMPTS = 5
LOCKOUT_MINUTES = 15

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ─── Logging ───
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# ─── Helpers ───
def get_jwt_secret():
    return os.environ["JWT_SECRET"]

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))

def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "exp": datetime.now(timezone.utc) + timedelta(minutes=60), "type": "access"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "refresh"}
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def set_auth_cookies(response: Response, access_token: str, refresh_token: str):
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user_id = payload["sub"]
        # Try user_id field first (Google OAuth), then _id (JWT auth)
        user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
        if not user:
            user = await db.users.find_one({"_id": ObjectId(user_id)})
            if user:
                user["_id"] = str(user["_id"])
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


# ─── Pydantic Models ───
class RegisterInput(BaseModel):
    full_name: str
    email: str
    mobile: str
    business_name: str
    business_types: List[str]
    password: str

class LoginInput(BaseModel):
    email: str
    password: str

class ForgotPasswordInput(BaseModel):
    email: str

class ResetPasswordInput(BaseModel):
    token: str
    password: str

class SessionInput(BaseModel):
    session_id: str


# ─── Brute Force ───
async def check_brute_force(ip: str, email: str):
    identifier = f"{ip}:{email}"
    record = await db.login_attempts.find_one({"identifier": identifier}, {"_id": 0})
    if record and record.get("attempts", 0) >= MAX_LOGIN_ATTEMPTS:
        locked_until = record.get("locked_until")
        if locked_until:
            if isinstance(locked_until, str):
                locked_until = datetime.fromisoformat(locked_until)
            if locked_until.tzinfo is None:
                locked_until = locked_until.replace(tzinfo=timezone.utc)
            if datetime.now(timezone.utc) < locked_until:
                remaining = int((locked_until - datetime.now(timezone.utc)).total_seconds())
                raise HTTPException(status_code=429, detail=f"Account locked. Try again in {remaining} seconds.")
            else:
                await db.login_attempts.delete_one({"identifier": identifier})

async def record_failed_attempt(ip: str, email: str):
    identifier = f"{ip}:{email}"
    record = await db.login_attempts.find_one({"identifier": identifier}, {"_id": 0})
    attempts = (record.get("attempts", 0) if record else 0) + 1
    update = {"attempts": attempts, "last_attempt": datetime.now(timezone.utc).isoformat()}
    if attempts >= MAX_LOGIN_ATTEMPTS:
        update["locked_until"] = (datetime.now(timezone.utc) + timedelta(minutes=LOCKOUT_MINUTES)).isoformat()
    await db.login_attempts.update_one({"identifier": identifier}, {"$set": update}, upsert=True)
    remaining = MAX_LOGIN_ATTEMPTS - attempts
    return remaining

async def clear_failed_attempts(ip: str, email: str):
    await db.login_attempts.delete_one({"identifier": f"{ip}:{email}"})


# ─── Auth Endpoints ───
@api_router.post("/auth/register")
async def register(input_data: RegisterInput, response: Response):
    email = input_data.email.lower().strip()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_id = f"user_{uuid.uuid4().hex[:12]}"
    user_doc = {
        "user_id": user_id,
        "full_name": input_data.full_name,
        "email": email,
        "mobile": input_data.mobile,
        "business_name": input_data.business_name,
        "business_types": input_data.business_types,
        "password_hash": hash_password(input_data.password),
        "role": "client",
        "plan_id": "free",
        "message_quota": 1000,
        "messages_used": 0,
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(user_doc)

    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    set_auth_cookies(response, access_token, refresh_token)

    user_doc.pop("password_hash")
    user_doc.pop("_id", None)
    return user_doc


@api_router.post("/auth/login")
async def login(input_data: LoginInput, request: Request, response: Response):
    email = input_data.email.lower().strip()
    ip = request.client.host if request.client else "unknown"

    await check_brute_force(ip, email)

    user = await db.users.find_one({"email": email})
    if not user:
        remaining = await record_failed_attempt(ip, email)
        raise HTTPException(status_code=401, detail=f"Invalid email or password. {remaining} attempts remaining.")

    if not verify_password(input_data.password, user.get("password_hash", "")):
        remaining = await record_failed_attempt(ip, email)
        raise HTTPException(status_code=401, detail=f"Invalid email or password. {remaining} attempts remaining.")

    await clear_failed_attempts(ip, email)

    user_id = user.get("user_id") or str(user["_id"])
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    set_auth_cookies(response, access_token, refresh_token)

    user.pop("password_hash", None)
    user.pop("_id", None)
    return user


@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    response.delete_cookie("session_token", path="/")
    return {"message": "Logged out"}


@api_router.get("/auth/me")
async def get_me(request: Request):
    # Check session_token first (Google OAuth)
    session_token = request.cookies.get("session_token")
    if session_token:
        session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
        if session:
            expires_at = session.get("expires_at")
            if isinstance(expires_at, str):
                expires_at = datetime.fromisoformat(expires_at)
            if expires_at and expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            if expires_at and expires_at > datetime.now(timezone.utc):
                user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
                if user:
                    user.pop("password_hash", None)
                    return user

    # Fall back to JWT access_token
    return await get_current_user(request)


@api_router.post("/auth/refresh")
async def refresh_token(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user_id = payload["sub"]
        user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
        if not user:
            user = await db.users.find_one({"_id": ObjectId(user_id)})
            if not user:
                raise HTTPException(status_code=401, detail="User not found")
            user["_id"] = str(user["_id"])
        access_token = create_access_token(user_id, user["email"])
        response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
        user.pop("password_hash", None)
        user.pop("_id", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Refresh token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")


@api_router.post("/auth/forgot-password")
async def forgot_password(input_data: ForgotPasswordInput):
    email = input_data.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user:
        # Don't reveal whether email exists
        return {"message": "If the email exists, a reset link has been sent."}

    token = secrets.token_urlsafe(32)
    await db.password_reset_tokens.insert_one({
        "token": token,
        "email": email,
        "expires_at": (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat(),
        "used": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
    reset_link = f"{frontend_url}/reset-password?token={token}"
    logger.info(f"Password reset link for {email}: {reset_link}")

    return {"message": "If the email exists, a reset link has been sent."}


@api_router.post("/auth/reset-password")
async def reset_password(input_data: ResetPasswordInput):
    record = await db.password_reset_tokens.find_one({"token": input_data.token, "used": False}, {"_id": 0})
    if not record:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    expires_at = record.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=400, detail="Reset token has expired")

    new_hash = hash_password(input_data.password)
    await db.users.update_one({"email": record["email"]}, {"$set": {"password_hash": new_hash}})
    await db.password_reset_tokens.update_one({"token": input_data.token}, {"$set": {"used": True}})

    return {"message": "Password reset successfully"}


@api_router.post("/auth/check-email")
async def check_email(data: dict):
    email = data.get("email", "").lower().strip()
    existing = await db.users.find_one({"email": email})
    return {"available": existing is None}


# ─── Emergent Google OAuth ───
@api_router.post("/auth/session")
async def exchange_session(input_data: SessionInput, response: Response):
    """Exchange Emergent OAuth session_id for user data and set session cookie."""
    try:
        async with httpx.AsyncClient() as http_client:
            resp = await http_client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": input_data.session_id},
                timeout=10,
            )
            if resp.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session")
            session_data = resp.json()
    except httpx.RequestError:
        raise HTTPException(status_code=502, detail="Auth service unavailable")

    email = session_data["email"].lower().strip()
    session_token = session_data.get("session_token", secrets.token_urlsafe(32))

    # Upsert user
    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one({"email": email}, {"$set": {
            "name": session_data.get("name", existing.get("name", "")),
            "picture": session_data.get("picture", existing.get("picture", "")),
        }})
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id,
            "email": email,
            "full_name": session_data.get("name", ""),
            "name": session_data.get("name", ""),
            "picture": session_data.get("picture", ""),
            "role": "client",
            "plan_id": "free",
            "message_quota": 1000,
            "messages_used": 0,
            "business_name": "",
            "business_types": [],
            "status": "active",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

    # Store session
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    # REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    response.set_cookie(key="session_token", value=session_token, httponly=True, secure=True, samesite="none", max_age=604800, path="/")

    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    user.pop("password_hash", None)
    return user


# ─── Agent Endpoints ───
class CreateAgentInput(BaseModel):
    name: str

@api_router.post("/agents")
async def create_agent(input_data: CreateAgentInput, request: Request):
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))

    # Check agent limit (free plan = 2)
    count = await db.agents.count_documents({"client_id": user_id})
    plan = user.get("plan_id", "free")
    limit = 2 if plan == "free" else 10
    if count >= limit:
        raise HTTPException(status_code=403, detail=f"Agent limit reached ({limit} on {plan} plan)")

    agent_id = str(uuid.uuid4())
    agent_doc = {
        "agent_id": agent_id,
        "client_id": user_id,
        "name": input_data.name,
        "image_url": "",
        "status": "active",
        "response_tone": "friendly",
        "response_language": "english",
        "greeting_message": f"Hello! Welcome to our business. How can I help you?",
        "fallback_message": "I'm not sure about that. Let me connect you with our team.",
        "channels": [],
        "messages_count": 0,
        "last_active": datetime.now(timezone.utc).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.agents.insert_one(agent_doc)
    agent_doc.pop("_id", None)
    return agent_doc


@api_router.get("/agents")
async def list_agents(request: Request):
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    agents = await db.agents.find({"client_id": user_id}, {"_id": 0}).to_list(100)
    return agents


@api_router.get("/agents/{agent_id}")
async def get_agent(agent_id: str, request: Request):
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    agent = await db.agents.find_one({"agent_id": agent_id, "client_id": user_id}, {"_id": 0})
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent


@api_router.delete("/agents/{agent_id}")
async def delete_agent(agent_id: str, request: Request):
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    result = await db.agents.delete_one({"agent_id": agent_id, "client_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Agent not found")
    return {"message": "Agent deleted"}


# ─── Dashboard Stats ───
@api_router.get("/dashboard/stats")
async def dashboard_stats(request: Request):
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    agent_count = await db.agents.count_documents({"client_id": user_id})
    return {
        "message_quota": user.get("message_quota", 1000),
        "messages_used": user.get("messages_used", 0),
        "remaining": user.get("message_quota", 1000) - user.get("messages_used", 0),
        "active_agents": agent_count,
    }


# ─── Health ───
@api_router.get("/")
async def root():
    return {"message": "Nurekha API v1"}


# ─── Include Router ───
app.include_router(api_router)

# ─── CORS ───
frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Startup ───
@app.on_event("startup")
async def startup():
    # Indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("user_id")
    await db.agents.create_index("client_id")
    await db.agents.create_index("agent_id", unique=True)
    await db.password_reset_tokens.create_index("expires_at", expireAfterSeconds=0)
    await db.login_attempts.create_index("identifier")
    await db.user_sessions.create_index("session_token")

    # Seed admin
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@nurekha.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "Admin@123")
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id,
            "full_name": "Admin",
            "email": admin_email,
            "mobile": "",
            "business_name": "Nurekha",
            "business_types": [],
            "password_hash": hash_password(admin_password),
            "role": "admin",
            "plan_id": "enterprise",
            "message_quota": 100000,
            "messages_used": 0,
            "status": "active",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info(f"Admin seeded: {admin_email}")
    elif not verify_password(admin_password, existing.get("password_hash", "")):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})
        logger.info("Admin password updated")

    # Write test credentials
    try:
        creds_path = Path("/app/memory/test_credentials.md")
        creds_path.parent.mkdir(parents=True, exist_ok=True)
        creds_path.write_text(
            f"# Test Credentials\n\n"
            f"## Admin\n- Email: {admin_email}\n- Password: {admin_password}\n- Role: admin\n\n"
            f"## Auth Endpoints\n- POST /api/auth/register\n- POST /api/auth/login\n- POST /api/auth/logout\n"
            f"- GET /api/auth/me\n- POST /api/auth/refresh\n- POST /api/auth/forgot-password\n"
            f"- POST /api/auth/reset-password\n- POST /api/auth/session (Google OAuth)\n"
        )
    except Exception as e:
        logger.warning(f"Could not write test credentials: {e}")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
