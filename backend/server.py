from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, WebSocket, WebSocketDisconnect
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import secrets
import bcrypt
import jwt
import csv
import io
from schemas import BUSINESS_TYPE_SCHEMAS, ALL_BUSINESS_TYPES, get_schema, get_collection_name, get_csv_headers
import httpx
import json
import hmac
import hashlib
import base64
import asyncio
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict
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


# ─── Default Schemas for Business Types ───
DEFAULT_SCHEMAS = {
    "ecommerce": {
        "collection_name": "products",
        "display_name": "Products",
        "fields": [
            {"field_name": "product_name", "field_type": "text", "required": True, "unique": False, "validation": {"max_length": 200}},
            {"field_name": "sku", "field_type": "text", "required": True, "unique": True, "validation": {}},
            {"field_name": "description", "field_type": "textarea", "required": False, "unique": False, "validation": {}},
            {"field_name": "category", "field_type": "dropdown", "required": False, "unique": False, "dropdown_options": ["Electronics", "Clothing", "Food", "Home & Garden", "Sports", "Books", "Other"], "validation": {}},
            {"field_name": "brand", "field_type": "text", "required": False, "unique": False, "validation": {}},
            {"field_name": "price", "field_type": "number", "required": True, "unique": False, "validation": {"min": 0}},
            {"field_name": "discount_price", "field_type": "number", "required": False, "unique": False, "validation": {"min": 0}},
            {"field_name": "stock_quantity", "field_type": "number", "required": True, "unique": False, "validation": {"min": 0}},
            {"field_name": "in_stock", "field_type": "checkbox", "required": False, "unique": False, "validation": {}},
            {"field_name": "images", "field_type": "image", "required": False, "unique": False, "validation": {"max_count": 6}},
            {"field_name": "product_url", "field_type": "url", "required": False, "unique": False, "validation": {}},
        ]
    },
    "hotel": {
        "collection_name": "rooms",
        "display_name": "Rooms",
        "fields": [
            {"field_name": "room_type", "field_type": "dropdown", "required": True, "unique": False, "dropdown_options": ["Standard", "Deluxe", "Suite", "Presidential"], "validation": {}},
            {"field_name": "room_number", "field_type": "text", "required": False, "unique": True, "validation": {}},
            {"field_name": "price_per_night", "field_type": "number", "required": True, "unique": False, "validation": {"min": 0}},
            {"field_name": "max_occupancy", "field_type": "number", "required": True, "unique": False, "validation": {"min": 1, "max": 10}},
            {"field_name": "available_rooms", "field_type": "number", "required": True, "unique": False, "validation": {"min": 0}},
            {"field_name": "amenities", "field_type": "textarea", "required": False, "unique": False, "validation": {}},
            {"field_name": "description", "field_type": "textarea", "required": False, "unique": False, "validation": {}},
            {"field_name": "images", "field_type": "image", "required": False, "unique": False, "validation": {"max_count": 6}},
            {"field_name": "availability_status", "field_type": "dropdown", "required": False, "unique": False, "dropdown_options": ["available", "booked", "maintenance"], "validation": {}},
        ]
    },
    "restaurant": {
        "collection_name": "menu_items",
        "display_name": "Menu Items",
        "fields": [
            {"field_name": "item_name", "field_type": "text", "required": True, "unique": False, "validation": {"max_length": 200}},
            {"field_name": "category", "field_type": "dropdown", "required": True, "unique": False, "dropdown_options": ["Appetizer", "Main Course", "Dessert", "Beverages", "Specials"], "validation": {}},
            {"field_name": "price", "field_type": "number", "required": True, "unique": False, "validation": {"min": 0}},
            {"field_name": "description", "field_type": "textarea", "required": False, "unique": False, "validation": {}},
            {"field_name": "ingredients", "field_type": "textarea", "required": False, "unique": False, "validation": {}},
            {"field_name": "dietary_info", "field_type": "dropdown", "required": False, "unique": False, "dropdown_options": ["Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free", "None"], "validation": {}},
            {"field_name": "spice_level", "field_type": "dropdown", "required": False, "unique": False, "dropdown_options": ["Mild", "Medium", "Spicy", "Extra Spicy"], "validation": {}},
            {"field_name": "available", "field_type": "checkbox", "required": False, "unique": False, "validation": {}},
            {"field_name": "images", "field_type": "image", "required": False, "unique": False, "validation": {"max_count": 3}},
        ]
    },
    "real_estate": {
        "collection_name": "properties",
        "display_name": "Properties",
        "fields": [
            {"field_name": "title", "field_type": "text", "required": True, "unique": False, "validation": {"max_length": 200}},
            {"field_name": "property_type", "field_type": "dropdown", "required": True, "unique": False, "dropdown_options": ["House", "Apartment", "Villa", "Land", "Commercial", "Office"], "validation": {}},
            {"field_name": "listing_type", "field_type": "dropdown", "required": True, "unique": False, "dropdown_options": ["sale", "rent"], "validation": {}},
            {"field_name": "price", "field_type": "number", "required": True, "unique": False, "validation": {"min": 0}},
            {"field_name": "location", "field_type": "text", "required": True, "unique": False, "validation": {}},
            {"field_name": "bedrooms", "field_type": "number", "required": False, "unique": False, "validation": {"min": 0}},
            {"field_name": "bathrooms", "field_type": "number", "required": False, "unique": False, "validation": {"min": 0}},
            {"field_name": "area_sqft", "field_type": "number", "required": False, "unique": False, "validation": {"min": 0}},
            {"field_name": "description", "field_type": "textarea", "required": False, "unique": False, "validation": {}},
            {"field_name": "images", "field_type": "image", "required": False, "unique": False, "validation": {"max_count": 6}},
            {"field_name": "status", "field_type": "dropdown", "required": False, "unique": False, "dropdown_options": ["available", "sold", "rented", "pending"], "validation": {}},
        ]
    },
    "isp": {
        "collection_name": "plans",
        "display_name": "Internet Plans",
        "fields": [
            {"field_name": "plan_name", "field_type": "text", "required": True, "unique": True, "validation": {"max_length": 100}},
            {"field_name": "speed", "field_type": "text", "required": True, "unique": False, "validation": {}},
            {"field_name": "price", "field_type": "number", "required": True, "unique": False, "validation": {"min": 0}},
            {"field_name": "data_limit", "field_type": "text", "required": False, "unique": False, "validation": {}},
            {"field_name": "installation_fee", "field_type": "number", "required": False, "unique": False, "validation": {"min": 0}},
            {"field_name": "coverage_area", "field_type": "text", "required": False, "unique": False, "validation": {}},
            {"field_name": "features", "field_type": "textarea", "required": False, "unique": False, "validation": {}},
            {"field_name": "availability", "field_type": "dropdown", "required": False, "unique": False, "dropdown_options": ["available", "limited", "unavailable"], "validation": {}},
        ]
    },
    "telecom": {
        "collection_name": "plans",
        "display_name": "Telecom Plans",
        "fields": [
            {"field_name": "plan_name", "field_type": "text", "required": True, "unique": True, "validation": {"max_length": 100}},
            {"field_name": "data", "field_type": "text", "required": True, "unique": False, "validation": {}},
            {"field_name": "calls", "field_type": "text", "required": True, "unique": False, "validation": {}},
            {"field_name": "sms", "field_type": "text", "required": False, "unique": False, "validation": {}},
            {"field_name": "validity", "field_type": "text", "required": True, "unique": False, "validation": {}},
            {"field_name": "price", "field_type": "number", "required": True, "unique": False, "validation": {"min": 0}},
            {"field_name": "features", "field_type": "textarea", "required": False, "unique": False, "validation": {}},
        ]
    },
    "vehicle": {
        "collection_name": "vehicles",
        "display_name": "Vehicles",
        "fields": [
            {"field_name": "vehicle_name", "field_type": "text", "required": True, "unique": False, "validation": {"max_length": 200}},
            {"field_name": "brand", "field_type": "text", "required": True, "unique": False, "validation": {}},
            {"field_name": "model", "field_type": "text", "required": True, "unique": False, "validation": {}},
            {"field_name": "year", "field_type": "number", "required": False, "unique": False, "validation": {"min": 1900, "max": 2030}},
            {"field_name": "price", "field_type": "number", "required": True, "unique": False, "validation": {"min": 0}},
            {"field_name": "mileage", "field_type": "text", "required": False, "unique": False, "validation": {}},
            {"field_name": "fuel_type", "field_type": "dropdown", "required": False, "unique": False, "dropdown_options": ["petrol", "diesel", "electric", "hybrid", "CNG"], "validation": {}},
            {"field_name": "transmission", "field_type": "dropdown", "required": False, "unique": False, "dropdown_options": ["manual", "automatic", "semi-automatic"], "validation": {}},
            {"field_name": "condition", "field_type": "dropdown", "required": False, "unique": False, "dropdown_options": ["new", "used", "certified"], "validation": {}},
            {"field_name": "description", "field_type": "textarea", "required": False, "unique": False, "validation": {}},
            {"field_name": "images", "field_type": "image", "required": False, "unique": False, "validation": {"max_count": 6}},
            {"field_name": "availability", "field_type": "dropdown", "required": False, "unique": False, "dropdown_options": ["available", "sold", "reserved"], "validation": {}},
        ]
    },
    "finance": {
        "collection_name": "products",
        "display_name": "Financial Products",
        "fields": [
            {"field_name": "product_name", "field_type": "text", "required": True, "unique": False, "validation": {"max_length": 200}},
            {"field_name": "product_type", "field_type": "dropdown", "required": True, "unique": False, "dropdown_options": ["loan", "insurance", "savings", "investment", "credit_card"], "validation": {}},
            {"field_name": "interest_rate", "field_type": "number", "required": False, "unique": False, "validation": {"min": 0, "max": 100}},
            {"field_name": "duration", "field_type": "text", "required": False, "unique": False, "validation": {}},
            {"field_name": "min_amount", "field_type": "number", "required": False, "unique": False, "validation": {"min": 0}},
            {"field_name": "max_amount", "field_type": "number", "required": False, "unique": False, "validation": {"min": 0}},
            {"field_name": "eligibility", "field_type": "textarea", "required": False, "unique": False, "validation": {}},
            {"field_name": "features", "field_type": "textarea", "required": False, "unique": False, "validation": {}},
        ]
    },
    "events": {
        "collection_name": "packages",
        "display_name": "Event Packages",
        "fields": [
            {"field_name": "package_name", "field_type": "text", "required": True, "unique": False, "validation": {"max_length": 200}},
            {"field_name": "event_type", "field_type": "dropdown", "required": False, "unique": False, "dropdown_options": ["Wedding", "Birthday", "Corporate", "Conference", "Party", "Other"], "validation": {}},
            {"field_name": "services_included", "field_type": "textarea", "required": True, "unique": False, "validation": {}},
            {"field_name": "price", "field_type": "number", "required": True, "unique": False, "validation": {"min": 0}},
            {"field_name": "duration", "field_type": "text", "required": False, "unique": False, "validation": {}},
            {"field_name": "max_guests", "field_type": "number", "required": False, "unique": False, "validation": {"min": 1}},
            {"field_name": "availability_dates", "field_type": "text", "required": False, "unique": False, "validation": {}},
            {"field_name": "images", "field_type": "image", "required": False, "unique": False, "validation": {"max_count": 6}},
        ]
    },
    "education": {
        "collection_name": "courses",
        "display_name": "Courses",
        "fields": [
            {"field_name": "course_name", "field_type": "text", "required": True, "unique": False, "validation": {"max_length": 200}},
            {"field_name": "category", "field_type": "dropdown", "required": False, "unique": False, "dropdown_options": ["Technology", "Business", "Arts", "Science", "Languages", "Other"], "validation": {}},
            {"field_name": "duration", "field_type": "text", "required": True, "unique": False, "validation": {}},
            {"field_name": "fees", "field_type": "number", "required": True, "unique": False, "validation": {"min": 0}},
            {"field_name": "eligibility", "field_type": "text", "required": False, "unique": False, "validation": {}},
            {"field_name": "mode", "field_type": "dropdown", "required": False, "unique": False, "dropdown_options": ["online", "offline", "hybrid"], "validation": {}},
            {"field_name": "start_dates", "field_type": "text", "required": False, "unique": False, "validation": {}},
            {"field_name": "instructor", "field_type": "text", "required": False, "unique": False, "validation": {}},
            {"field_name": "description", "field_type": "textarea", "required": False, "unique": False, "validation": {}},
        ]
    },
    "healthcare": {
        "collection_name": "doctors",
        "display_name": "Doctors / Services",
        "fields": [
            {"field_name": "doctor_name", "field_type": "text", "required": True, "unique": False, "validation": {"max_length": 200}},
            {"field_name": "specialization", "field_type": "text", "required": True, "unique": False, "validation": {}},
            {"field_name": "qualification", "field_type": "text", "required": False, "unique": False, "validation": {}},
            {"field_name": "experience_years", "field_type": "number", "required": False, "unique": False, "validation": {"min": 0}},
            {"field_name": "consultation_fee", "field_type": "number", "required": True, "unique": False, "validation": {"min": 0}},
            {"field_name": "availability", "field_type": "text", "required": False, "unique": False, "validation": {}},
            {"field_name": "location", "field_type": "text", "required": False, "unique": False, "validation": {}},
            {"field_name": "phone", "field_type": "phone", "required": False, "unique": False, "validation": {}},
            {"field_name": "email", "field_type": "email", "required": False, "unique": False, "validation": {}},
        ]
    },
    "travel": {
        "collection_name": "packages",
        "display_name": "Travel Packages",
        "fields": [
            {"field_name": "package_name", "field_type": "text", "required": True, "unique": False, "validation": {"max_length": 200}},
            {"field_name": "destination", "field_type": "text", "required": True, "unique": False, "validation": {}},
            {"field_name": "duration_days", "field_type": "number", "required": True, "unique": False, "validation": {"min": 1}},
            {"field_name": "price", "field_type": "number", "required": True, "unique": False, "validation": {"min": 0}},
            {"field_name": "available_seats", "field_type": "number", "required": False, "unique": False, "validation": {"min": 0}},
            {"field_name": "start_dates", "field_type": "text", "required": False, "unique": False, "validation": {}},
            {"field_name": "inclusions", "field_type": "textarea", "required": False, "unique": False, "validation": {}},
            {"field_name": "exclusions", "field_type": "textarea", "required": False, "unique": False, "validation": {}},
            {"field_name": "images", "field_type": "image", "required": False, "unique": False, "validation": {"max_count": 6}},
        ]
    },
    "service": {
        "collection_name": "services",
        "display_name": "Services",
        "fields": [
            {"field_name": "service_name", "field_type": "text", "required": True, "unique": False, "validation": {"max_length": 200}},
            {"field_name": "category", "field_type": "dropdown", "required": False, "unique": False, "dropdown_options": ["Grooming", "Spa", "Repair", "Cleaning", "Consultation", "Other"], "validation": {}},
            {"field_name": "price", "field_type": "number", "required": True, "unique": False, "validation": {"min": 0}},
            {"field_name": "duration", "field_type": "text", "required": False, "unique": False, "validation": {}},
            {"field_name": "staff", "field_type": "text", "required": False, "unique": False, "validation": {}},
            {"field_name": "description", "field_type": "textarea", "required": False, "unique": False, "validation": {}},
            {"field_name": "availability", "field_type": "dropdown", "required": False, "unique": False, "dropdown_options": ["available", "booked", "unavailable"], "validation": {}},
        ]
    }
}


def detect_field_type(values):
    """
    Auto-detect field type based on sample values
    Returns: field_type (text, number, date, email, phone, url, checkbox)
    """
    import re
    from datetime import datetime
    
    # Filter out empty values
    non_empty = [str(v).strip() for v in values if v and str(v).strip()]
    if not non_empty:
        return "text"
    
    # Sample up to 10 values
    sample = non_empty[:10]
    
    # Check for checkbox/boolean (yes/no, true/false, 1/0)
    boolean_values = {"yes", "no", "true", "false", "1", "0", "y", "n"}
    if all(str(v).lower() in boolean_values for v in sample):
        return "checkbox"
    
    # Check for numbers
    number_count = 0
    for v in sample:
        try:
            float(v.replace(",", ""))  # Handle 1,000 format
            number_count += 1
        except:
            pass
    if number_count == len(sample):
        return "number"
    
    # Check for dates
    date_patterns = [
        r'\d{4}-\d{2}-\d{2}',  # YYYY-MM-DD
        r'\d{2}/\d{2}/\d{4}',  # MM/DD/YYYY
        r'\d{2}-\d{2}-\d{4}',  # DD-MM-YYYY
    ]
    date_count = 0
    for v in sample:
        if any(re.match(pattern, str(v)) for pattern in date_patterns):
            date_count += 1
    if date_count >= len(sample) * 0.8:  # 80% match
        return "date"
    
    # Check for email
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if all(re.match(email_pattern, str(v)) for v in sample):
        return "email"
    
    # Check for phone
    phone_pattern = r'^[\d\s\-\+\(\)]{8,}$'
    if all(re.match(phone_pattern, str(v).replace(" ", "")) for v in sample):
        return "phone"
    
    # Check for URL
    url_pattern = r'^https?://'
    if all(re.match(url_pattern, str(v), re.I) for v in sample):
        return "url"
    
    # Check if text is long (textarea candidate)
    avg_length = sum(len(str(v)) for v in sample) / len(sample)
    if avg_length > 100:
        return "textarea"
    
    # Default to text
    return "text"


def parse_csv_and_detect_schema(csv_content: str, max_rows_to_analyze: int = 50):
    """
    Parse CSV content and auto-detect schema
    Returns: (headers, detected_fields, sample_data)
    """
    lines = csv_content.strip().split('\n')
    if len(lines) < 2:
        raise ValueError("CSV must have at least 2 lines (header + data)")
    
    reader = csv.reader(io.StringIO(csv_content))
    rows = list(reader)
    
    headers = [h.strip().lower().replace(" ", "_") for h in rows[0]]
    data_rows = rows[1:max_rows_to_analyze + 1]
    
    if not headers:
        raise ValueError("CSV headers are empty")
    
    # Transpose data to get values per column
    columns = {}
    for i, header in enumerate(headers):
        columns[header] = [row[i] if i < len(row) else "" for row in data_rows]
    
    # Detect field types
    detected_fields = []
    for header in headers:
        values = columns[header]
        field_type = detect_field_type(values)
        
        detected_fields.append({
            "field_name": header,
            "field_type": field_type,
            "required": False,  # User can change this
            "unique": False,
            "validation": {},
            "dropdown_options": []
        })
    
    # Prepare sample data (first 5 rows)
    sample_data = []
    for row in data_rows[:5]:
        item = {}
        for i, header in enumerate(headers):
            item[header] = row[i] if i < len(row) else ""
        sample_data.append(item)
    
    return headers, detected_fields, sample_data


async def create_default_schema_for_agent(agent_id: str, business_type: str):
    """Create default schema for an agent based on its business type"""
    if business_type not in DEFAULT_SCHEMAS:
        return None
    
    schema_template = DEFAULT_SCHEMAS[business_type]
    now = datetime.now(timezone.utc).isoformat()
    
    # Check if default schema already exists
    existing = await db.agent_schemas.find_one({
        "agent_id": agent_id,
        "collection_name": schema_template["collection_name"]
    })
    
    if existing:
        return existing
    
    schema_doc = {
        "agent_id": agent_id,
        "collection_name": schema_template["collection_name"],
        "display_name": schema_template["display_name"],
        "fields": schema_template["fields"],
        "is_default": True,
        "created_at": now,
        "updated_at": now
    }
    
    await db.agent_schemas.insert_one(schema_doc)
    schema_doc.pop("_id", None)
    return schema_doc


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
    # Auto-detect if we should use secure cookies based on environment
    is_production = os.environ.get("FRONTEND_URL", "").startswith("https://")
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=is_production, samesite="none" if is_production else "lax", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=is_production, samesite="none" if is_production else "lax", max_age=604800, path="/")

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
    business_types: Optional[List[str]] = []
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
BUSINESS_TYPES = ALL_BUSINESS_TYPES

class CreateAgentInput(BaseModel):
    name: str
    business_type: Optional[str] = "Other"

@api_router.post("/agents")
async def create_agent(input_data: CreateAgentInput, request: Request):
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))

    # Check agent limit (free plan = 2)
    count = await db.agents.count_documents({"client_id": user_id})
    plan = user.get("plan_id", "free")
    limit = 2 if plan == "free" else 10
    extra = user.get("extra_agents", 0)
    if count >= (limit + extra):
        raise HTTPException(status_code=403, detail=f"Agent limit reached ({limit + extra} on {plan} plan)")

    # Validate business type
    biz_type = input_data.business_type if input_data.business_type in BUSINESS_TYPES else "Other"

    agent_id = str(uuid.uuid4())
    agent_doc = {
        "agent_id": agent_id,
        "client_id": user_id,
        "name": input_data.name,
        "business_type": biz_type,
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

    # Create default schema for this business type
    await create_default_schema_for_agent(agent_id, biz_type)

    # Create notification
    await db.notifications.insert_one({
        "notification_id": str(uuid.uuid4()),
        "user_id": user_id,
        "type": "agent_created",
        "title": "Agent Created",
        "message": f"Your agent '{input_data.name}' has been created successfully.",
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

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


# ─── Agent Update ───
class UpdateAgentInput(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None
    response_tone: Optional[str] = None
    response_language: Optional[str] = None
    greeting_message: Optional[str] = None
    fallback_message: Optional[str] = None

@api_router.patch("/agents/{agent_id}")
async def update_agent(agent_id: str, input_data: UpdateAgentInput, request: Request):
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    updates = {k: v for k, v in input_data.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = await db.agents.update_one({"agent_id": agent_id, "client_id": user_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Agent not found")
    agent = await db.agents.find_one({"agent_id": agent_id}, {"_id": 0})
    return agent


# ─── Channel Endpoints ───
class ConnectChannelInput(BaseModel):
    channel_type: str
    page_id: Optional[str] = ""
    page_name: Optional[str] = ""
    config: Optional[dict] = {}

@api_router.post("/agents/{agent_id}/channels")
async def connect_channel(agent_id: str, input_data: ConnectChannelInput, request: Request):
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    agent = await db.agents.find_one({"agent_id": agent_id, "client_id": user_id})
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    channel_id = str(uuid.uuid4())
    channel_doc = {
        "channel_id": channel_id,
        "agent_id": agent_id,
        "channel_type": input_data.channel_type,
        "page_id": input_data.page_id,
        "page_name": input_data.page_name,
        "config": input_data.config,
        "is_active": True,
        "connected_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.channels.insert_one(channel_doc)
    channel_doc.pop("_id", None)
    return channel_doc

@api_router.get("/agents/{agent_id}/channels")
async def list_channels(agent_id: str, request: Request):
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    agent = await db.agents.find_one({"agent_id": agent_id, "client_id": user_id})
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    channels = await db.channels.find({"agent_id": agent_id}, {"_id": 0}).to_list(20)
    return channels

@api_router.delete("/agents/{agent_id}/channels/{channel_id}")
async def disconnect_channel(agent_id: str, channel_id: str, request: Request):
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    agent = await db.agents.find_one({"agent_id": agent_id, "client_id": user_id})
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    result = await db.channels.delete_one({"channel_id": channel_id, "agent_id": agent_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Channel not found")
    return {"message": "Channel disconnected"}


# ─── Training: Business Info ───
class BusinessInfoInput(BaseModel):
    description: Optional[str] = ""
    contact_phone: Optional[str] = ""
    contact_email: Optional[str] = ""
    address: Optional[str] = ""
    business_hours: Optional[dict] = {}
    response_tone: Optional[str] = "friendly"
    response_language: Optional[str] = "english"

@api_router.put("/agents/{agent_id}/training/business-info")
async def update_business_info(agent_id: str, input_data: BusinessInfoInput, request: Request):
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    agent = await db.agents.find_one({"agent_id": agent_id, "client_id": user_id})
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    data = input_data.model_dump()
    data["agent_id"] = agent_id
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.business_info.update_one({"agent_id": agent_id}, {"$set": data}, upsert=True)
    doc = await db.business_info.find_one({"agent_id": agent_id}, {"_id": 0})
    # Also update agent tone/language
    await db.agents.update_one({"agent_id": agent_id}, {"$set": {"response_tone": data["response_tone"], "response_language": data["response_language"]}})
    return doc

@api_router.get("/agents/{agent_id}/training/business-info")
async def get_business_info(agent_id: str, request: Request):
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    agent = await db.agents.find_one({"agent_id": agent_id, "client_id": user_id})
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    doc = await db.business_info.find_one({"agent_id": agent_id}, {"_id": 0})
    return doc or {"agent_id": agent_id, "description": "", "contact_phone": "", "contact_email": "", "address": "", "business_hours": {}, "response_tone": "friendly", "response_language": "english"}


# ─── Training: FAQs ───
class FAQInput(BaseModel):
    question: str
    answer: str

@api_router.post("/agents/{agent_id}/training/faqs")
async def create_faq(agent_id: str, input_data: FAQInput, request: Request):
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    agent = await db.agents.find_one({"agent_id": agent_id, "client_id": user_id})
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    faq_id = str(uuid.uuid4())
    faq_doc = {"faq_id": faq_id, "agent_id": agent_id, "question": input_data.question, "answer": input_data.answer, "order": 0, "created_at": datetime.now(timezone.utc).isoformat()}
    await db.faqs.insert_one(faq_doc)
    faq_doc.pop("_id", None)
    return faq_doc

@api_router.get("/agents/{agent_id}/training/faqs")
async def list_faqs(agent_id: str, request: Request):
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    agent = await db.agents.find_one({"agent_id": agent_id, "client_id": user_id})
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    faqs = await db.faqs.find({"agent_id": agent_id}, {"_id": 0}).sort("order", 1).to_list(500)
    return faqs

@api_router.put("/agents/{agent_id}/training/faqs/{faq_id}")
async def update_faq(agent_id: str, faq_id: str, input_data: FAQInput, request: Request):
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    agent = await db.agents.find_one({"agent_id": agent_id, "client_id": user_id})
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    result = await db.faqs.update_one({"faq_id": faq_id, "agent_id": agent_id}, {"$set": {"question": input_data.question, "answer": input_data.answer}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="FAQ not found")
    faq = await db.faqs.find_one({"faq_id": faq_id}, {"_id": 0})
    return faq

@api_router.delete("/agents/{agent_id}/training/faqs/{faq_id}")
async def delete_faq(agent_id: str, faq_id: str, request: Request):
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    agent = await db.agents.find_one({"agent_id": agent_id, "client_id": user_id})
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    result = await db.faqs.delete_one({"faq_id": faq_id, "agent_id": agent_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="FAQ not found")
    return {"message": "FAQ deleted"}


# ─── Training: Documents ───
class DocumentInput(BaseModel):
    name: str
    doc_type: Optional[str] = "file"
    url: Optional[str] = ""
    size: Optional[int] = 0

@api_router.post("/agents/{agent_id}/training/documents")
async def create_document(agent_id: str, input_data: DocumentInput, request: Request):
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    agent = await db.agents.find_one({"agent_id": agent_id, "client_id": user_id})
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    doc_id = str(uuid.uuid4())
    doc = {"doc_id": doc_id, "agent_id": agent_id, "name": input_data.name, "doc_type": input_data.doc_type, "url": input_data.url, "size": input_data.size, "status": "ready", "created_at": datetime.now(timezone.utc).isoformat()}
    await db.documents.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.get("/agents/{agent_id}/training/documents")
async def list_documents(agent_id: str, request: Request):
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    agent = await db.agents.find_one({"agent_id": agent_id, "client_id": user_id})
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    docs = await db.documents.find({"agent_id": agent_id}, {"_id": 0}).to_list(100)
    return docs

@api_router.delete("/agents/{agent_id}/training/documents/{doc_id}")
async def delete_document(agent_id: str, doc_id: str, request: Request):
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    agent = await db.agents.find_one({"agent_id": agent_id, "client_id": user_id})
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    result = await db.documents.delete_one({"doc_id": doc_id, "agent_id": agent_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"message": "Document deleted"}


# ─── Training: Products ───
class ProductInput(BaseModel):
    name: str
    price: Optional[float] = 0
    stock: Optional[int] = 0
    category: Optional[str] = ""
    description: Optional[str] = ""
    image_url: Optional[str] = ""
    is_active: Optional[bool] = True

@api_router.post("/agents/{agent_id}/training/products")
async def create_product(agent_id: str, input_data: ProductInput, request: Request):
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    agent = await db.agents.find_one({"agent_id": agent_id, "client_id": user_id})
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    product_id = str(uuid.uuid4())
    product_doc = {**input_data.model_dump(), "product_id": product_id, "agent_id": agent_id, "created_at": datetime.now(timezone.utc).isoformat()}
    await db.products.insert_one(product_doc)
    product_doc.pop("_id", None)
    return product_doc

@api_router.get("/agents/{agent_id}/training/products")
async def list_products(agent_id: str, request: Request):
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    agent = await db.agents.find_one({"agent_id": agent_id, "client_id": user_id})
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    products = await db.products.find({"agent_id": agent_id}, {"_id": 0}).to_list(500)
    return products

@api_router.put("/agents/{agent_id}/training/products/{product_id}")
async def update_product(agent_id: str, product_id: str, input_data: ProductInput, request: Request):
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    agent = await db.agents.find_one({"agent_id": agent_id, "client_id": user_id})
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    result = await db.products.update_one({"product_id": product_id, "agent_id": agent_id}, {"$set": input_data.model_dump()})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    product = await db.products.find_one({"product_id": product_id}, {"_id": 0})
    return product

@api_router.delete("/agents/{agent_id}/training/products/{product_id}")
async def delete_product(agent_id: str, product_id: str, request: Request):
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    agent = await db.agents.find_one({"agent_id": agent_id, "client_id": user_id})
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    result = await db.products.delete_one({"product_id": product_id, "agent_id": agent_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted"}


# ─── Conversations ───
class ConversationInput(BaseModel):
    end_user_name: str
    channel: Optional[str] = "website"

@api_router.get("/agents/{agent_id}/conversations")
async def list_conversations(agent_id: str, request: Request):
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    agent = await db.agents.find_one({"agent_id": agent_id, "client_id": user_id})
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    convos = await db.conversations.find({"agent_id": agent_id}, {"_id": 0}).sort("last_message_at", -1).to_list(200)
    return convos

@api_router.post("/agents/{agent_id}/conversations")
async def create_conversation(agent_id: str, input_data: ConversationInput, request: Request):
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    agent = await db.agents.find_one({"agent_id": agent_id, "client_id": user_id})
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    conv_id = str(uuid.uuid4())
    conv_doc = {
        "conv_id": conv_id, "agent_id": agent_id,
        "channel": input_data.channel, "end_user_name": input_data.end_user_name,
        "end_user_avatar": "", "is_muted": False, "is_blocked": False,
        "ai_enabled": True, "unread_count": 0,
        "last_message": "", "last_message_at": datetime.now(timezone.utc).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.conversations.insert_one(conv_doc)
    conv_doc.pop("_id", None)
    return conv_doc


# ─── Messages ───
class MessageInput(BaseModel):
    content: str
    sender_type: Optional[str] = "agent"

@api_router.get("/agents/{agent_id}/conversations/{conv_id}/messages")
async def list_messages(agent_id: str, conv_id: str, request: Request):
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    agent = await db.agents.find_one({"agent_id": agent_id, "client_id": user_id})
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    messages = await db.messages.find({"conv_id": conv_id}, {"_id": 0}).sort("created_at", 1).to_list(500)
    return messages

@api_router.post("/agents/{agent_id}/conversations/{conv_id}/messages")
async def send_message(agent_id: str, conv_id: str, input_data: MessageInput, request: Request):
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    agent = await db.agents.find_one({"agent_id": agent_id, "client_id": user_id})
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    msg_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    msg_doc = {"msg_id": msg_id, "conv_id": conv_id, "agent_id": agent_id, "sender_type": input_data.sender_type, "content": input_data.content, "message_type": "text", "created_at": now}
    await db.messages.insert_one(msg_doc)
    # Update conversation
    await db.conversations.update_one({"conv_id": conv_id}, {"$set": {"last_message": input_data.content, "last_message_at": now}})
    msg_doc.pop("_id", None)
    return msg_doc

@api_router.patch("/agents/{agent_id}/conversations/{conv_id}")
async def update_conversation(agent_id: str, conv_id: str, request: Request):
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    body = await request.json()
    updates = {}
    for key in ["ai_enabled", "is_muted", "is_blocked"]:
        if key in body:
            updates[key] = body[key]
    if updates:
        await db.conversations.update_one({"conv_id": conv_id, "agent_id": agent_id}, {"$set": updates})
    conv = await db.conversations.find_one({"conv_id": conv_id}, {"_id": 0})
    return conv


# ─── Agent Overview Stats ───
@api_router.get("/agents/{agent_id}/stats")
async def agent_stats(agent_id: str, request: Request):
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    agent = await db.agents.find_one({"agent_id": agent_id, "client_id": user_id}, {"_id": 0})
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    channel_count = await db.channels.count_documents({"agent_id": agent_id})
    conv_count = await db.conversations.count_documents({"agent_id": agent_id})
    msg_count = await db.messages.count_documents({"agent_id": agent_id})
    faq_count = await db.faqs.count_documents({"agent_id": agent_id})
    product_count = await db.products.count_documents({"agent_id": agent_id})

    # Message distribution by sender type (for pie chart)
    agent_msgs = await db.messages.count_documents({"agent_id": agent_id, "sender_type": "agent"})
    user_msgs = await db.messages.count_documents({"agent_id": agent_id, "sender_type": "user"})
    bot_msgs = await db.messages.count_documents({"agent_id": agent_id, "sender_type": "bot"})
    message_distribution = [
        {"name": "Agent", "value": agent_msgs},
        {"name": "User", "value": user_msgs},
        {"name": "Bot", "value": bot_msgs},
    ]

    # Daily message counts for last 7 days
    daily_activity = []
    for i in range(6, -1, -1):
        day = datetime.now(timezone.utc) - timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
        day_end = day.replace(hour=23, minute=59, second=59, microsecond=999999).isoformat()
        day_count = await db.messages.count_documents({
            "agent_id": agent_id,
            "created_at": {"$gte": day_start, "$lte": day_end}
        })
        daily_activity.append({"day": day.strftime("%a"), "date": day.strftime("%m/%d"), "messages": day_count})

    return {
        **agent,
        "channel_count": channel_count,
        "conversation_count": conv_count,
        "message_count": msg_count,
        "faq_count": faq_count,
        "product_count": product_count,
        "message_distribution": message_distribution,
        "daily_activity": daily_activity,
    }


# ─── Dashboard Stats ───
@api_router.get("/dashboard/stats")
async def dashboard_stats(request: Request):
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    agent_count = await db.agents.count_documents({"client_id": user_id})

    # Get all agents for this user
    agents = await db.agents.find({"client_id": user_id}, {"agent_id": 1, "name": 1, "_id": 0}).to_list(100)
    agent_ids = [a["agent_id"] for a in agents]

    # Message counts per agent (for pie chart)
    agent_message_distribution = []
    total_messages = 0
    for a in agents:
        msg_count = await db.messages.count_documents({"agent_id": a["agent_id"]})
        agent_message_distribution.append({"name": a.get("name", "Agent"), "value": msg_count})
        total_messages += msg_count

    # Daily message counts for last 7 days (for bar chart)
    daily_usage = []
    for i in range(6, -1, -1):
        day = datetime.now(timezone.utc) - timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
        day_end = (day.replace(hour=23, minute=59, second=59, microsecond=999999)).isoformat()
        day_count = await db.messages.count_documents({
            "agent_id": {"$in": agent_ids},
            "created_at": {"$gte": day_start, "$lte": day_end}
        }) if agent_ids else 0
        daily_usage.append({"day": day.strftime("%a"), "date": day.strftime("%m/%d"), "messages": day_count})

    return {
        "message_quota": user.get("message_quota", 1000),
        "messages_used": user.get("messages_used", 0),
        "remaining": user.get("message_quota", 1000) - user.get("messages_used", 0),
        "active_agents": agent_count,
        "total_messages": total_messages,
        "agent_message_distribution": agent_message_distribution,
        "daily_usage": daily_usage,
    }


# ─── Payment / Billing ───
PLANS = {
    "free": {"name": "Free", "price": 0, "message_quota": 1000, "agent_limit": 2},
    "pro": {"name": "Pro", "price": 2999, "message_quota": 10000, "agent_limit": 5},
    "enterprise": {"name": "Enterprise", "price": 9999, "message_quota": 100000, "agent_limit": 10},
}

class InitiatePaymentInput(BaseModel):
    plan_id: str
    payment_method: str  # "esewa" or "khalti"

@api_router.get("/billing/plans")
async def get_plans():
    return [{"plan_id": k, **v} for k, v in PLANS.items()]

@api_router.get("/billing/history")
async def payment_history(request: Request):
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    payments = await db.payments.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return payments

@api_router.post("/billing/initiate")
async def initiate_payment(input_data: InitiatePaymentInput, request: Request):
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    plan = PLANS.get(input_data.plan_id)
    if not plan or plan["price"] == 0:
        raise HTTPException(status_code=400, detail="Invalid plan for payment")

    payment_id = str(uuid.uuid4())
    frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")

    if input_data.payment_method == "khalti":
        khalti_key = os.environ.get("KHALTI_SECRET_KEY", "")
        khalti_url = os.environ.get("KHALTI_API_URL", "https://dev.khalti.com/api/v2/epayment/initiate/")
        payload = {
            "return_url": f"{frontend_url}/dashboard/billing?payment_id={payment_id}&method=khalti",
            "website_url": frontend_url,
            "amount": plan["price"] * 100,  # paisa
            "purchase_order_id": payment_id,
            "purchase_order_name": f"Nurekha {plan['name']} Plan",
            "customer_info": {"name": user.get("full_name", ""), "email": user.get("email", ""), "phone": user.get("mobile", "9800000001")},
        }
        try:
            async with httpx.AsyncClient() as client_http:
                resp = await client_http.post(khalti_url, json=payload, headers={"Authorization": f"key {khalti_key}", "Content-Type": "application/json"}, timeout=15)
                if resp.status_code == 200:
                    result = resp.json()
                    pidx = result.get("pidx", "")
                    payment_url = result.get("payment_url", "")
                else:
                    # Fallback for demo: create simulated payment
                    pidx = f"demo_{payment_id}"
                    payment_url = f"{frontend_url}/dashboard/billing?payment_id={payment_id}&method=khalti&status=success&pidx={pidx}"
        except Exception:
            pidx = f"demo_{payment_id}"
            payment_url = f"{frontend_url}/dashboard/billing?payment_id={payment_id}&method=khalti&status=success&pidx={pidx}"

        await db.payments.insert_one({
            "payment_id": payment_id, "user_id": user_id, "plan_id": input_data.plan_id,
            "amount": plan["price"], "currency": "NPR", "method": "khalti",
            "pidx": pidx, "status": "pending", "created_at": datetime.now(timezone.utc).isoformat(),
        })
        return {"payment_id": payment_id, "payment_url": payment_url, "pidx": pidx}

    elif input_data.payment_method == "esewa":
        esewa_code = os.environ.get("ESEWA_MERCHANT_CODE", "EPAYTEST")
        esewa_secret = os.environ.get("ESEWA_SECRET_KEY", "8gBm/:&EnhH.1/q")
        total_amount = str(plan["price"])
        transaction_uuid = payment_id
        signed_field_names = "total_amount,transaction_uuid,product_code"
        message = f"total_amount={total_amount},transaction_uuid={transaction_uuid},product_code={esewa_code}"
        signature = base64.b64encode(hmac.new(esewa_secret.encode(), message.encode(), hashlib.sha256).digest()).decode()

        await db.payments.insert_one({
            "payment_id": payment_id, "user_id": user_id, "plan_id": input_data.plan_id,
            "amount": plan["price"], "currency": "NPR", "method": "esewa",
            "status": "pending", "created_at": datetime.now(timezone.utc).isoformat(),
        })
        esewa_url = os.environ.get("ESEWA_API_URL", "https://rc-epay.esewa.com.np/api/epay/main/v2/form")
        return {
            "payment_id": payment_id,
            "esewa_form": {
                "url": esewa_url,
                "fields": {
                    "amount": total_amount, "tax_amount": "0", "total_amount": total_amount,
                    "transaction_uuid": transaction_uuid, "product_code": esewa_code,
                    "product_service_charge": "0", "product_delivery_charge": "0",
                    "success_url": f"{frontend_url}/dashboard/billing?payment_id={payment_id}&method=esewa&status=success",
                    "failure_url": f"{frontend_url}/dashboard/billing?payment_id={payment_id}&method=esewa&status=failure",
                    "signed_field_names": signed_field_names, "signature": signature,
                },
            },
        }
    else:
        raise HTTPException(status_code=400, detail="Invalid payment method")


@api_router.post("/billing/verify")
async def verify_payment(request: Request):
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    body = await request.json()
    payment_id = body.get("payment_id", "")
    method = body.get("method", "")

    payment = await db.payments.find_one({"payment_id": payment_id, "user_id": user_id}, {"_id": 0})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    if method == "khalti":
        pidx = body.get("pidx", payment.get("pidx", ""))
        khalti_key = os.environ.get("KHALTI_SECRET_KEY", "")
        khalti_lookup = os.environ.get("KHALTI_LOOKUP_URL", "https://dev.khalti.com/api/v2/epayment/lookup/")
        verified = False
        try:
            async with httpx.AsyncClient() as client_http:
                resp = await client_http.post(khalti_lookup, json={"pidx": pidx}, headers={"Authorization": f"key {khalti_key}", "Content-Type": "application/json"}, timeout=10)
                if resp.status_code == 200:
                    data = resp.json()
                    if data.get("status") == "Completed":
                        verified = True
        except Exception:
            pass

        # Demo mode: accept if pidx starts with demo_
        if pidx.startswith("demo_"):
            verified = True

        if verified:
            plan = PLANS.get(payment["plan_id"], {})
            await db.payments.update_one({"payment_id": payment_id}, {"$set": {"status": "completed", "verified_at": datetime.now(timezone.utc).isoformat()}})
            await db.users.update_one({"user_id": user_id}, {"$set": {"plan_id": payment["plan_id"], "message_quota": plan.get("message_quota", 1000)}})
            return {"status": "completed", "plan_id": payment["plan_id"]}
        else:
            await db.payments.update_one({"payment_id": payment_id}, {"$set": {"status": "failed"}})
            return {"status": "failed"}

    elif method == "esewa":
        # Demo mode: accept the payment
        plan = PLANS.get(payment["plan_id"], {})
        await db.payments.update_one({"payment_id": payment_id}, {"$set": {"status": "completed", "verified_at": datetime.now(timezone.utc).isoformat()}})
        await db.users.update_one({"user_id": user_id}, {"$set": {"plan_id": payment["plan_id"], "message_quota": plan.get("message_quota", 1000)}})
        return {"status": "completed", "plan_id": payment["plan_id"]}

    return {"status": "unknown"}


# ─── Orders (Full CRUD with status workflow) ───
ORDER_STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"]

class CreateOrderInput(BaseModel):
    agent_id: str
    end_user_name: str
    items: List[dict]
    total_amount: float
    payment_method: Optional[str] = "cod"
    delivery_address: Optional[str] = ""
    notes: Optional[str] = ""

class UpdateOrderStatusInput(BaseModel):
    status: str

@api_router.post("/orders")
async def create_order(input_data: CreateOrderInput, request: Request):
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    agent = await db.agents.find_one({"agent_id": input_data.agent_id, "client_id": user_id})
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    order_id = f"ORD-{uuid.uuid4().hex[:8].upper()}"
    now = datetime.now(timezone.utc).isoformat()
    order_doc = {
        "order_id": order_id, "agent_id": input_data.agent_id, "client_id": user_id,
        "end_user_name": input_data.end_user_name, "items": input_data.items,
        "total_amount": input_data.total_amount, "payment_method": input_data.payment_method,
        "payment_status": "unpaid", "order_status": "pending",
        "delivery_address": input_data.delivery_address, "notes": input_data.notes,
        "status_history": [{"status": "pending", "timestamp": now}],
        "created_at": now, "updated_at": now,
    }
    await db.orders.insert_one(order_doc)
    order_doc.pop("_id", None)
    return order_doc

@api_router.get("/orders")
async def list_orders(request: Request, agent_id: Optional[str] = None, status: Optional[str] = None):
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    query = {"client_id": user_id}
    if agent_id:
        query["agent_id"] = agent_id
    if status:
        query["order_status"] = status
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return orders

@api_router.get("/orders/{order_id}")
async def get_order(order_id: str, request: Request):
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    order = await db.orders.find_one({"order_id": order_id, "client_id": user_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@api_router.patch("/orders/{order_id}/status")
async def update_order_status(order_id: str, input_data: UpdateOrderStatusInput, request: Request):
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    if input_data.status not in ORDER_STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {ORDER_STATUSES}")
    order = await db.orders.find_one({"order_id": order_id, "client_id": user_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    now = datetime.now(timezone.utc).isoformat()
    history = order.get("status_history", [])
    history.append({"status": input_data.status, "timestamp": now})
    payment_status = order.get("payment_status", "unpaid")
    if input_data.status == "confirmed":
        payment_status = "paid"
    elif input_data.status == "cancelled":
        payment_status = "refunded" if payment_status == "paid" else "cancelled"
    await db.orders.update_one({"order_id": order_id}, {"$set": {"order_status": input_data.status, "payment_status": payment_status, "status_history": history, "updated_at": now}})
    updated = await db.orders.find_one({"order_id": order_id}, {"_id": 0})
    return updated


# ─── WebSocket for Real-time Chat ───
class ConnectionManager:
    def __init__(self):
        self.active: Dict[str, List[WebSocket]] = {}

    async def connect(self, conv_id: str, websocket: WebSocket):
        await websocket.accept()
        if conv_id not in self.active:
            self.active[conv_id] = []
        self.active[conv_id].append(websocket)

    def disconnect(self, conv_id: str, websocket: WebSocket):
        if conv_id in self.active:
            self.active[conv_id] = [ws for ws in self.active[conv_id] if ws != websocket]
            if not self.active[conv_id]:
                del self.active[conv_id]

    async def broadcast(self, conv_id: str, message: dict):
        if conv_id in self.active:
            dead = []
            for ws in self.active[conv_id]:
                try:
                    await ws.send_json(message)
                except Exception:
                    dead.append(ws)
            for ws in dead:
                self.disconnect(conv_id, ws)

ws_manager = ConnectionManager()

@app.websocket("/ws/chat/{conv_id}")
async def websocket_chat(websocket: WebSocket, conv_id: str):
    # Verify conversation exists
    conv = await db.conversations.find_one({"conv_id": conv_id})
    if not conv:
        await websocket.close(code=4004, reason="Conversation not found")
        return

    await ws_manager.connect(conv_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            content = data.get("content", "")
            sender_type = data.get("sender_type", "agent")
            if not content:
                continue
            msg_id = str(uuid.uuid4())
            now = datetime.now(timezone.utc).isoformat()
            msg_doc = {"msg_id": msg_id, "conv_id": conv_id, "agent_id": conv["agent_id"], "sender_type": sender_type, "content": content, "message_type": "text", "created_at": now}
            await db.messages.insert_one(msg_doc)
            await db.conversations.update_one({"conv_id": conv_id}, {"$set": {"last_message": content, "last_message_at": now}})
            msg_doc.pop("_id", None)
            await ws_manager.broadcast(conv_id, msg_doc)
    except WebSocketDisconnect:
        ws_manager.disconnect(conv_id, websocket)
    except Exception:
        ws_manager.disconnect(conv_id, websocket)


# ─── Bulk Upload: FAQs CSV ───
@api_router.post("/agents/{agent_id}/training/faqs/bulk")
async def bulk_upload_faqs(agent_id: str, request: Request):
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    agent = await db.agents.find_one({"agent_id": agent_id, "client_id": user_id})
    if not agent:
        raise HTTPException(status_code=400, detail="Agent not found")
    body = await request.json()
    faqs_data = body.get("faqs", [])
    created = []
    for item in faqs_data:
        q = item.get("question", "").strip()
        a = item.get("answer", "").strip()
        if q and a:
            faq_id = str(uuid.uuid4())
            doc = {"faq_id": faq_id, "agent_id": agent_id, "question": q, "answer": a, "order": 0, "created_at": datetime.now(timezone.utc).isoformat()}
            await db.faqs.insert_one(doc)
            doc.pop("_id", None)
            created.append(doc)
    return {"imported": len(created), "faqs": created}

# ─── Bulk Upload: Products CSV ───
@api_router.post("/agents/{agent_id}/training/products/bulk")
async def bulk_upload_products(agent_id: str, request: Request):
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    agent = await db.agents.find_one({"agent_id": agent_id, "client_id": user_id})
    if not agent:
        raise HTTPException(status_code=400, detail="Agent not found")
    body = await request.json()
    products_data = body.get("products", [])
    created = []
    for item in products_data:
        name = item.get("name", "").strip()
        if name:
            product_id = str(uuid.uuid4())
            doc = {"product_id": product_id, "agent_id": agent_id, "name": name, "price": float(item.get("price", 0)), "stock": int(item.get("stock", 0)), "category": item.get("category", ""), "description": item.get("description", ""), "image_url": item.get("image_url", ""), "sku": item.get("sku", ""), "variants": item.get("variants", []), "is_active": True, "created_at": datetime.now(timezone.utc).isoformat()}
            await db.products.insert_one(doc)
            doc.pop("_id", None)
            created.append(doc)
    return {"imported": len(created), "products": created}


# ─── Test Agent Chat (AI mock using FAQs) ───
@api_router.post("/agents/{agent_id}/test-chat")
async def test_agent_chat(agent_id: str, request: Request):
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    agent = await db.agents.find_one({"agent_id": agent_id, "client_id": user_id}, {"_id": 0})
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    body = await request.json()
    user_message = body.get("message", "").strip().lower()
    if not user_message:
        return {"response": agent.get("greeting_message", "Hello! How can I help you?")}
    # Search FAQs for best match
    faqs = await db.faqs.find({"agent_id": agent_id}, {"_id": 0}).to_list(500)
    best_match = None
    best_score = 0
    for faq in faqs:
        q_words = set(faq["question"].lower().split())
        msg_words = set(user_message.split())
        overlap = len(q_words & msg_words)
        if overlap > best_score:
            best_score = overlap
            best_match = faq
    # Search products
    products = await db.products.find({"agent_id": agent_id}, {"_id": 0}).to_list(100)
    product_match = None
    for p in products:
        if p["name"].lower() in user_message or any(w in user_message for w in p["name"].lower().split()):
            product_match = p
            break
    if best_match and best_score >= 2:
        return {"response": best_match["answer"], "source": "FAQ", "matched_question": best_match["question"]}
    elif product_match:
        return {"response": f"We have {product_match['name']} available at NPR {product_match.get('price', 0):,.0f}. {product_match.get('description', '')} Would you like to order?", "source": "Product", "matched_product": product_match["name"]}
    elif any(w in user_message for w in ["hi", "hello", "hey", "namaste"]):
        return {"response": agent.get("greeting_message", "Hello! How can I help you today?"), "source": "Greeting"}
    elif any(w in user_message for w in ["price", "cost", "how much", "rate"]):
        if products:
            product_list = ", ".join([f"{p['name']} (NPR {p.get('price', 0):,.0f})" for p in products[:5]])
            return {"response": f"Here are our products: {product_list}. Would you like to know more about any of them?", "source": "Products"}
    elif any(w in user_message for w in ["order", "buy", "purchase"]):
        return {"response": "I'd be happy to help you place an order! What would you like to order?", "source": "Intent"}
    elif any(w in user_message for w in ["hours", "open", "close", "time"]):
        biz_info = await db.business_info.find_one({"agent_id": agent_id}, {"_id": 0})
        if biz_info and biz_info.get("business_hours"):
            hrs = biz_info["business_hours"]
            open_days = [f"{d}: {h.get('open','09:00')}-{h.get('close','18:00')}" for d, h in hrs.items()]
            return {"response": f"Our business hours are:\n" + "\n".join(open_days), "source": "Business Info"}
    return {"response": agent.get("fallback_message", "I'm not sure about that. Let me connect you with our team."), "source": "Fallback"}


# ─── Support Tickets ───
class TicketInput(BaseModel):
    subject: str
    message: str
    priority: Optional[str] = "medium"
    attachments: Optional[List[dict]] = []

@api_router.post("/support/tickets")
async def create_ticket(input_data: TicketInput, request: Request):
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    ticket_id = f"TKT-{uuid.uuid4().hex[:8].upper()}"
    now = datetime.now(timezone.utc).isoformat()
    ticket = {
        "ticket_id": ticket_id, "user_id": user_id,
        "user_name": user.get("full_name", ""), "user_email": user.get("email", ""),
        "subject": input_data.subject, "message": input_data.message,
        "priority": input_data.priority, "status": "open",
        "attachments": input_data.attachments or [],
        "replies": [], "read_by_user": True,
        "created_at": now, "updated_at": now,
    }
    await db.tickets.insert_one(ticket)
    ticket.pop("_id", None)
    return ticket

@api_router.get("/support/tickets")
async def list_tickets(request: Request):
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    tickets = await db.tickets.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return tickets

@api_router.post("/support/tickets/{ticket_id}/reply")
async def reply_ticket(ticket_id: str, request: Request):
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    body = await request.json()
    reply = {
        "sender": user.get("full_name", "User"),
        "message": body.get("message", ""),
        "attachments": body.get("attachments", []),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.tickets.update_one(
        {"ticket_id": ticket_id},
        {
            "$push": {"replies": reply},
            "$set": {"updated_at": datetime.now(timezone.utc).isoformat(), "read_by_user": False},
        }
    )
    ticket = await db.tickets.find_one({"ticket_id": ticket_id}, {"_id": 0})

    # Create notification for ticket update
    ticket_user_id = ticket.get("user_id", user_id)
    await db.notifications.insert_one({
        "notification_id": str(uuid.uuid4()),
        "user_id": ticket_user_id,
        "type": "ticket_reply",
        "title": "Ticket Updated",
        "message": f"New reply on ticket {ticket_id}: {ticket.get('subject', '')}",
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    return ticket

@api_router.get("/support/tickets/unread-count")
async def unread_tickets_count(request: Request):
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    count = await db.tickets.count_documents({"user_id": user_id, "read_by_user": False})
    return {"count": count}

@api_router.patch("/support/tickets/{ticket_id}/mark-read")
async def mark_ticket_read(ticket_id: str, request: Request):
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    await db.tickets.update_one({"ticket_id": ticket_id, "user_id": user_id}, {"$set": {"read_by_user": True}})
    return {"message": "Marked as read"}

# ─── File Upload for Tickets ───
@api_router.post("/support/upload")
async def upload_ticket_file(request: Request):
    """Accept base64 file data and store metadata."""
    user = await get_current_user(request)
    body = await request.json()
    file_name = body.get("file_name", "attachment")
    file_type = body.get("file_type", "application/octet-stream")
    file_size = body.get("file_size", 0)
    file_data = body.get("file_data", "")  # base64

    if file_size > 5 * 1024 * 1024:  # 5MB limit
        raise HTTPException(status_code=400, detail="File too large. Maximum 5MB allowed.")

    file_id = str(uuid.uuid4())
    file_doc = {
        "file_id": file_id,
        "file_name": file_name,
        "file_type": file_type,
        "file_size": file_size,
        "file_data": file_data,
        "uploaded_by": user.get("user_id", ""),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.uploaded_files.insert_one(file_doc)
    file_doc.pop("_id", None)
    file_doc.pop("file_data", None)  # Don't return the data
    return file_doc

@api_router.patch("/support/tickets/{ticket_id}")
async def update_ticket(ticket_id: str, request: Request):
    body = await request.json()
    updates = {}
    for k in ["status", "priority"]:
        if k in body:
            updates[k] = body[k]
    if updates:
        updates["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.tickets.update_one({"ticket_id": ticket_id}, {"$set": updates})
    ticket = await db.tickets.find_one({"ticket_id": ticket_id}, {"_id": 0})
    return ticket


# ─── User Profile ───
@api_router.put("/auth/profile")
async def update_profile(request: Request):
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    body = await request.json()
    updates = {}
    for k in ["full_name", "mobile", "business_name"]:
        if k in body:
            updates[k] = body[k]
    if updates:
        await db.users.update_one({"user_id": user_id}, {"$set": updates})
    updated = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    updated.pop("password_hash", None)
    return updated

@api_router.post("/auth/change-password")
async def change_password(request: Request):
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    body = await request.json()
    current_pw = body.get("current_password", "")
    new_pw = body.get("new_password", "")
    full_user = await db.users.find_one({"user_id": user_id})
    if not full_user or not verify_password(current_pw, full_user.get("password_hash", "")):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(new_pw) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters")
    await db.users.update_one({"user_id": user_id}, {"$set": {"password_hash": hash_password(new_pw)}})
    return {"message": "Password changed successfully"}


# ─── Credits Purchase ───
CREDIT_PACKS = [
    {"pack_id": "msg_1k", "name": "1,000 Messages", "type": "messages", "amount": 1000, "price": 499},
    {"pack_id": "msg_5k", "name": "5,000 Messages", "type": "messages", "amount": 5000, "price": 1999},
    {"pack_id": "msg_20k", "name": "20,000 Messages", "type": "messages", "amount": 20000, "price": 6999},
    {"pack_id": "agent_1", "name": "+1 Agent Slot", "type": "agent", "amount": 1, "price": 999},
    {"pack_id": "agent_3", "name": "+3 Agent Slots", "type": "agent", "amount": 3, "price": 2499},
]

@api_router.get("/billing/credits")
async def get_credit_packs():
    return CREDIT_PACKS

@api_router.post("/billing/buy-credits")
async def buy_credits(request: Request):
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    body = await request.json()
    pack_id = body.get("pack_id", "")
    payment_method = body.get("payment_method", "khalti")
    pack = next((p for p in CREDIT_PACKS if p["pack_id"] == pack_id), None)
    if not pack:
        raise HTTPException(status_code=400, detail="Invalid pack")
    payment_id = str(uuid.uuid4())
    # Demo mode: instantly apply credits
    if pack["type"] == "messages":
        current = user.get("message_quota", 1000)
        await db.users.update_one({"user_id": user_id}, {"$set": {"message_quota": current + pack["amount"]}})
    elif pack["type"] == "agent":
        # Increase agent limit by storing in user doc
        current_extra = user.get("extra_agents", 0)
        await db.users.update_one({"user_id": user_id}, {"$set": {"extra_agents": current_extra + pack["amount"]}})
    await db.payments.insert_one({"payment_id": payment_id, "user_id": user_id, "pack_id": pack_id, "plan_id": "credits", "amount": pack["price"], "currency": "NPR", "method": payment_method, "status": "completed", "created_at": datetime.now(timezone.utc).isoformat()})
    return {"message": f"Added {pack['name']}!", "payment_id": payment_id}


# ─── Custom Credits Purchase ───
PRICE_PER_MESSAGE = 0.5  # NPR per message credit

@api_router.post("/billing/buy-custom")
async def buy_custom_credits(request: Request):
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    body = await request.json()
    credit_type = body.get("type", "messages")  # "messages" or "agents"
    quantity = body.get("quantity", 0)
    payment_method = body.get("payment_method", "khalti")

    if credit_type == "messages":
        if not isinstance(quantity, int) or quantity < 100:
            raise HTTPException(status_code=400, detail="Minimum purchase is 100 message credits")
        price = int(quantity * PRICE_PER_MESSAGE)
        current = user.get("message_quota", 1000)
        await db.users.update_one({"user_id": user_id}, {"$set": {"message_quota": current + quantity}})
        item_name = f"{quantity:,} Messages"
    elif credit_type == "agents":
        if not isinstance(quantity, int) or quantity < 1:
            raise HTTPException(status_code=400, detail="Minimum purchase is 1 agent slot")
        price = quantity * 999
        current_extra = user.get("extra_agents", 0)
        await db.users.update_one({"user_id": user_id}, {"$set": {"extra_agents": current_extra + quantity}})
        item_name = f"+{quantity} Agent Slot{'s' if quantity > 1 else ''}"
    else:
        raise HTTPException(status_code=400, detail="Invalid credit type")

    payment_id = str(uuid.uuid4())
    await db.payments.insert_one({
        "payment_id": payment_id, "user_id": user_id,
        "pack_id": f"custom_{credit_type}_{quantity}",
        "plan_id": "credits", "amount": price, "currency": "NPR",
        "method": payment_method, "status": "completed",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"message": f"Added {item_name}!", "payment_id": payment_id, "amount": price}


# ─── Order Refund ───
@api_router.post("/orders/{order_id}/refund")
async def refund_order(order_id: str, request: Request):
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    order = await db.orders.find_one({"order_id": order_id, "client_id": user_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.get("payment_status") != "paid":
        raise HTTPException(status_code=400, detail="Only paid orders can be refunded")
    body = await request.json()
    reason = body.get("reason", "")
    refund_amount = body.get("amount", order.get("total_amount", 0))
    now = datetime.now(timezone.utc).isoformat()
    refund_id = f"REF-{uuid.uuid4().hex[:8].upper()}"
    history = order.get("status_history", [])
    history.append({"status": "refunded", "timestamp": now, "note": reason})
    await db.orders.update_one({"order_id": order_id}, {"$set": {"payment_status": "refunded", "order_status": "cancelled", "refund_id": refund_id, "refund_amount": refund_amount, "refund_reason": reason, "status_history": history, "updated_at": now}})
    updated = await db.orders.find_one({"order_id": order_id}, {"_id": 0})

    # Create notification
    await db.notifications.insert_one({
        "notification_id": str(uuid.uuid4()),
        "user_id": user_id,
        "type": "order_refunded",
        "title": "Refund Processed",
        "message": f"Order {order_id} refunded NPR {refund_amount}. Reason: {reason or 'N/A'}",
        "read": False,
        "created_at": now,
    })

    return updated


@api_router.get("/refunds")
async def list_refunds(request: Request, agent_id: Optional[str] = None):
    """List all refunded orders for the user."""
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    query = {"client_id": user_id, "refund_id": {"$exists": True, "$ne": None}}
    if agent_id:
        query["agent_id"] = agent_id
    refunds = await db.orders.find(query, {"_id": 0}).sort("updated_at", -1).to_list(500)
    return refunds


# ─── Agent Settings ───
class AgentSettingsInput(BaseModel):
    greeting_message: Optional[str] = None
    fallback_message: Optional[str] = None
    response_tone: Optional[str] = None
    response_language: Optional[str] = None
    auto_reply_delay: Optional[int] = None
    max_conversation_length: Optional[int] = None
    collect_user_info: Optional[bool] = None
    handoff_keywords: Optional[List[str]] = None

@api_router.put("/agents/{agent_id}/settings")
async def update_agent_settings(agent_id: str, input_data: AgentSettingsInput, request: Request):
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    agent = await db.agents.find_one({"agent_id": agent_id, "client_id": user_id})
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    updates = {k: v for k, v in input_data.model_dump().items() if v is not None}
    if updates:
        await db.agents.update_one({"agent_id": agent_id}, {"$set": updates})
    updated = await db.agents.find_one({"agent_id": agent_id}, {"_id": 0})
    return updated


# ─── Hotel: Rooms ───
class RoomInput(BaseModel):
    room_type: str
    room_number: Optional[str] = ""
    price_per_night: float
    capacity: Optional[int] = 2
    amenities: Optional[List[str]] = []
    description: Optional[str] = ""
    is_available: Optional[bool] = True

@api_router.post("/agents/{agent_id}/rooms")
async def create_room(agent_id: str, input_data: RoomInput, request: Request):
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    agent = await db.agents.find_one({"agent_id": agent_id, "client_id": user_id})
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    room_id = str(uuid.uuid4())
    room_doc = {
        **input_data.model_dump(), "room_id": room_id, "agent_id": agent_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.rooms.insert_one(room_doc)
    room_doc.pop("_id", None)
    return room_doc

@api_router.get("/agents/{agent_id}/rooms")
async def list_rooms(agent_id: str, request: Request):
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    agent = await db.agents.find_one({"agent_id": agent_id, "client_id": user_id})
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    rooms = await db.rooms.find({"agent_id": agent_id}, {"_id": 0}).to_list(200)
    return rooms

@api_router.put("/agents/{agent_id}/rooms/{room_id}")
async def update_room(agent_id: str, room_id: str, input_data: RoomInput, request: Request):
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    agent = await db.agents.find_one({"agent_id": agent_id, "client_id": user_id})
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    result = await db.rooms.update_one({"room_id": room_id, "agent_id": agent_id}, {"$set": input_data.model_dump()})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Room not found")
    room = await db.rooms.find_one({"room_id": room_id}, {"_id": 0})
    return room

@api_router.delete("/agents/{agent_id}/rooms/{room_id}")
async def delete_room(agent_id: str, room_id: str, request: Request):
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    agent = await db.agents.find_one({"agent_id": agent_id, "client_id": user_id})
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    result = await db.rooms.delete_one({"room_id": room_id, "agent_id": agent_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Room not found")
    return {"message": "Room deleted"}


# ─── Hotel: Bookings ───
BOOKING_STATUSES = ["pending", "confirmed", "checked_in", "checked_out", "cancelled"]

class BookingInput(BaseModel):
    agent_id: str
    room_id: str
    guest_name: str
    guest_email: Optional[str] = ""
    guest_phone: Optional[str] = ""
    check_in: str
    check_out: str
    total_amount: float
    notes: Optional[str] = ""

@api_router.post("/bookings")
async def create_booking(input_data: BookingInput, request: Request):
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    agent = await db.agents.find_one({"agent_id": input_data.agent_id, "client_id": user_id})
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    booking_id = f"BKG-{uuid.uuid4().hex[:8].upper()}"
    now = datetime.now(timezone.utc).isoformat()
    booking_doc = {
        "booking_id": booking_id, "agent_id": input_data.agent_id, "client_id": user_id,
        "room_id": input_data.room_id, "guest_name": input_data.guest_name,
        "guest_email": input_data.guest_email, "guest_phone": input_data.guest_phone,
        "check_in": input_data.check_in, "check_out": input_data.check_out,
        "total_amount": input_data.total_amount, "notes": input_data.notes,
        "booking_status": "pending", "payment_status": "unpaid",
        "status_history": [{"status": "pending", "timestamp": now}],
        "created_at": now, "updated_at": now,
    }
    await db.bookings.insert_one(booking_doc)
    booking_doc.pop("_id", None)
    return booking_doc

@api_router.get("/bookings")
async def list_bookings(request: Request, agent_id: Optional[str] = None, status: Optional[str] = None):
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    query = {"client_id": user_id}
    if agent_id:
        query["agent_id"] = agent_id
    if status:
        query["booking_status"] = status
    bookings = await db.bookings.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return bookings

@api_router.patch("/bookings/{booking_id}/status")
async def update_booking_status(booking_id: str, request: Request):
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    body = await request.json()
    new_status = body.get("status", "")
    if new_status not in BOOKING_STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {BOOKING_STATUSES}")
    booking = await db.bookings.find_one({"booking_id": booking_id, "client_id": user_id})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    now = datetime.now(timezone.utc).isoformat()
    history = booking.get("status_history", [])
    history.append({"status": new_status, "timestamp": now})
    payment_status = booking.get("payment_status", "unpaid")
    if new_status == "confirmed":
        payment_status = "paid"
    elif new_status == "cancelled":
        payment_status = "refunded" if payment_status == "paid" else "cancelled"
    await db.bookings.update_one({"booking_id": booking_id}, {"$set": {"booking_status": new_status, "payment_status": payment_status, "status_history": history, "updated_at": now}})
    updated = await db.bookings.find_one({"booking_id": booking_id}, {"_id": 0})
    return updated


# ─── Business Types ───
@api_router.get("/business-types")
async def get_business_types():
    return ALL_BUSINESS_TYPES

@api_router.get("/business-types/{biz_type}/schema")
async def get_business_type_schema(biz_type: str):
    from schemas import get_schema as get_biz_schema
    schema = get_biz_schema(biz_type)
    if not schema:
        raise HTTPException(status_code=404, detail="Unknown business type")
    return schema


# ─── Generic Business Data CRUD ───

@api_router.get("/agents/{agent_id}/business-data")
async def list_business_data(agent_id: str, request: Request):
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    agent = await db.agents.find_one({"agent_id": agent_id, "client_id": user_id}, {"_id": 0})
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    biz_type = agent.get("business_type", "")
    col_name = get_collection_name(biz_type)
    if not col_name:
        return []
    items = await db[col_name].find({"agent_id": agent_id}, {"_id": 0}).to_list(2000)
    return items


@api_router.post("/agents/{agent_id}/business-data")
async def add_business_data(agent_id: str, request: Request):
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    agent = await db.agents.find_one({"agent_id": agent_id, "client_id": user_id}, {"_id": 0})
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    biz_type = agent.get("business_type", "")
    col_name = get_collection_name(biz_type)
    if not col_name:
        raise HTTPException(status_code=400, detail="Business type not configured")
    body = await request.json()
    item_id = str(uuid.uuid4())
    item = {**body, "item_id": item_id, "agent_id": agent_id, "created_at": datetime.now(timezone.utc).isoformat()}
    await db[col_name].insert_one(item)
    item.pop("_id", None)
    return item


@api_router.put("/agents/{agent_id}/business-data/{item_id}")
async def update_business_data(agent_id: str, item_id: str, request: Request):
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    agent = await db.agents.find_one({"agent_id": agent_id, "client_id": user_id}, {"_id": 0})
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    biz_type = agent.get("business_type", "")
    col_name = get_collection_name(biz_type)
    if not col_name:
        raise HTTPException(status_code=400, detail="Business type not configured")
    body = await request.json()
    body.pop("item_id", None)
    body.pop("agent_id", None)
    body.pop("_id", None)
    result = await db[col_name].update_one({"item_id": item_id, "agent_id": agent_id}, {"$set": body})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    updated = await db[col_name].find_one({"item_id": item_id}, {"_id": 0})
    return updated


@api_router.delete("/agents/{agent_id}/business-data/{item_id}")
async def delete_business_data(agent_id: str, item_id: str, request: Request):
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    agent = await db.agents.find_one({"agent_id": agent_id, "client_id": user_id}, {"_id": 0})
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    biz_type = agent.get("business_type", "")
    col_name = get_collection_name(biz_type)
    if not col_name:
        raise HTTPException(status_code=400, detail="Business type not configured")
    result = await db[col_name].delete_one({"item_id": item_id, "agent_id": agent_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "Deleted"}


@api_router.post("/agents/{agent_id}/business-data/bulk")
async def bulk_upload_business_data(agent_id: str, request: Request):
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    agent = await db.agents.find_one({"agent_id": agent_id, "client_id": user_id}, {"_id": 0})
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    biz_type = agent.get("business_type", "")
    col_name = get_collection_name(biz_type)
    if not col_name:
        raise HTTPException(status_code=400, detail="Business type not configured")
    body = await request.json()
    items_data = body.get("items", [])
    if not items_data:
        raise HTTPException(status_code=400, detail="No items provided")
    inserted = []
    for item_data in items_data:
        item_id = str(uuid.uuid4())
        item = {**item_data, "item_id": item_id, "agent_id": agent_id, "created_at": datetime.now(timezone.utc).isoformat()}
        await db[col_name].insert_one(item)
        item.pop("_id", None)
        inserted.append(item)
    return {"message": f"Uploaded {len(inserted)} items", "count": len(inserted), "items": inserted}


@api_router.post("/agents/{agent_id}/business-data/bulk-delete")
async def bulk_delete_business_data(agent_id: str, request: Request):
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    agent = await db.agents.find_one({"agent_id": agent_id, "client_id": user_id}, {"_id": 0})
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    biz_type = agent.get("business_type", "")
    col_name = get_collection_name(biz_type)
    if not col_name:
        raise HTTPException(status_code=400, detail="Business type not configured")
    body = await request.json()
    item_ids = body.get("item_ids", [])
    if not item_ids:
        raise HTTPException(status_code=400, detail="No item IDs provided")
    result = await db[col_name].delete_many({"item_id": {"$in": item_ids}, "agent_id": agent_id})
    return {"message": f"Deleted {result.deleted_count} items", "count": result.deleted_count}


@api_router.get("/agents/{agent_id}/business-data/csv-template")
async def download_csv_template(agent_id: str, request: Request):
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    agent = await db.agents.find_one({"agent_id": agent_id, "client_id": user_id}, {"_id": 0})
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    biz_type = agent.get("business_type", "")
    headers = get_csv_headers(biz_type)
    if not headers:
        raise HTTPException(status_code=400, detail="No template for this business type")
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(headers)
    # Add sample row
    schema = get_schema(biz_type)
    sample = []
    for h in headers:
        field = next((f for f in schema["fields"] if f["key"] == h), None)
        if field:
            if field["type"] == "number":
                sample.append("0")
            elif field.get("options"):
                sample.append(field["options"][0])
            elif field.get("default"):
                sample.append(str(field["default"]))
            else:
                sample.append(f"sample_{h}")
        else:
            sample.append("")
    writer.writerow(sample)
    csv_content = output.getvalue()
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={biz_type}_template.csv"}
    )


# ─── Dynamic Schema Management ───

@api_router.get("/agents/{agent_id}/schemas")
async def get_agent_schemas(agent_id: str, request: Request):
    """Get all custom schemas for an agent"""
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    
    # Verify agent ownership
    agent = await db.agents.find_one({"agent_id": agent_id, "client_id": user_id}, {"_id": 0})
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # Get all schemas for this agent
    schemas = await db.agent_schemas.find({"agent_id": agent_id}, {"_id": 0}).to_list(100)
    return schemas


@api_router.get("/agents/{agent_id}/schemas/{collection_name}")
async def get_agent_schema(agent_id: str, collection_name: str, request: Request):
    """Get specific schema for a collection"""
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    
    # Verify agent ownership
    agent = await db.agents.find_one({"agent_id": agent_id, "client_id": user_id}, {"_id": 0})
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    schema = await db.agent_schemas.find_one(
        {"agent_id": agent_id, "collection_name": collection_name},
        {"_id": 0}
    )
    
    if not schema:
        raise HTTPException(status_code=404, detail="Schema not found")
    
    return schema


@api_router.post("/agents/{agent_id}/schemas/initialize-default")
async def initialize_default_schema(agent_id: str, request: Request):
    """Initialize or reset to default schema for an agent's business type"""
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    
    # Verify agent ownership
    agent = await db.agents.find_one({"agent_id": agent_id, "client_id": user_id}, {"_id": 0})
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    business_type = agent.get("business_type", "")
    
    if business_type not in DEFAULT_SCHEMAS:
        raise HTTPException(status_code=400, detail=f"No default schema available for business type '{business_type}'")
    
    schema = await create_default_schema_for_agent(agent_id, business_type)
    return schema


@api_router.post("/agents/{agent_id}/schemas")
async def create_or_update_schema(agent_id: str, request: Request):
    """Create or update a custom schema"""
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    
    # Verify agent ownership
    agent = await db.agents.find_one({"agent_id": agent_id, "client_id": user_id}, {"_id": 0})
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    body = await request.json()
    collection_name = body.get("collection_name", "").strip().lower().replace(" ", "_")
    fields = body.get("fields", [])
    
    if not collection_name:
        raise HTTPException(status_code=400, detail="collection_name is required")
    
    if not fields or len(fields) == 0:
        raise HTTPException(status_code=400, detail="At least one field is required")
    
    if len(fields) > 20:
        raise HTTPException(status_code=400, detail="Maximum 20 fields allowed")
    
    # Validate field types
    valid_types = ["text", "textarea", "number", "date", "dropdown", "checkbox", "image", "email", "phone", "url"]
    for field in fields:
        if field.get("field_type") not in valid_types:
            raise HTTPException(status_code=400, detail=f"Invalid field_type: {field.get('field_type')}")
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Check if schema exists
    existing = await db.agent_schemas.find_one({"agent_id": agent_id, "collection_name": collection_name})
    
    schema_doc = {
        "agent_id": agent_id,
        "collection_name": collection_name,
        "display_name": body.get("display_name", collection_name.replace("_", " ").title()),
        "fields": fields,
        "updated_at": now
    }
    
    if existing:
        # Update existing schema
        await db.agent_schemas.update_one(
            {"agent_id": agent_id, "collection_name": collection_name},
            {"$set": schema_doc}
        )
    else:
        # Create new schema
        schema_doc["created_at"] = now
        await db.agent_schemas.insert_one(schema_doc)
    
    schema_doc.pop("_id", None)
    return schema_doc


@api_router.delete("/agents/{agent_id}/schemas/{collection_name}")
async def delete_schema(agent_id: str, collection_name: str, request: Request):
    """Delete a custom schema and all its data"""
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    
    # Verify agent ownership
    agent = await db.agents.find_one({"agent_id": agent_id, "client_id": user_id}, {"_id": 0})
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # Delete schema
    result = await db.agent_schemas.delete_one({"agent_id": agent_id, "collection_name": collection_name})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Schema not found")
    
    # Also delete all data for this collection
    await db.agent_collections.delete_many({"agent_id": agent_id, "collection_name": collection_name})
    
    return {"message": "Schema and data deleted successfully"}


# ─── Dynamic Collection Data CRUD ───

@api_router.get("/agents/{agent_id}/collections/{collection_name}/items")
async def get_collection_items(agent_id: str, collection_name: str, request: Request):
    """Get all items in a collection"""
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    
    # Verify agent ownership
    agent = await db.agents.find_one({"agent_id": agent_id, "client_id": user_id}, {"_id": 0})
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # Get items
    items = await db.agent_collections.find(
        {"agent_id": agent_id, "collection_name": collection_name},
        {"_id": 0}
    ).sort("created_at", -1).to_list(1000)
    
    return items


@api_router.post("/agents/{agent_id}/collections/{collection_name}/items")
async def create_collection_item(agent_id: str, collection_name: str, request: Request):
    """Create a new item in a collection"""
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    
    # Verify agent ownership
    agent = await db.agents.find_one({"agent_id": agent_id, "client_id": user_id}, {"_id": 0})
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # Verify schema exists
    schema = await db.agent_schemas.find_one(
        {"agent_id": agent_id, "collection_name": collection_name},
        {"_id": 0}
    )
    if not schema:
        raise HTTPException(status_code=404, detail="Schema not found for this collection")
    
    body = await request.json()
    data = body.get("data", {})
    
    # Validate required fields
    for field in schema.get("fields", []):
        if field.get("required") and not data.get(field["field_name"]):
            raise HTTPException(status_code=400, detail=f"Field '{field['field_name']}' is required")
    
    now = datetime.now(timezone.utc).isoformat()
    item_id = f"item_{uuid.uuid4().hex[:12]}"
    
    item_doc = {
        "agent_id": agent_id,
        "collection_name": collection_name,
        "item_id": item_id,
        "data": data,
        "created_at": now,
        "updated_at": now
    }
    
    await db.agent_collections.insert_one(item_doc)
    item_doc.pop("_id", None)
    return item_doc


@api_router.put("/agents/{agent_id}/collections/{collection_name}/items/{item_id}")
async def update_collection_item(agent_id: str, collection_name: str, item_id: str, request: Request):
    """Update an existing item"""
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    
    # Verify agent ownership
    agent = await db.agents.find_one({"agent_id": agent_id, "client_id": user_id}, {"_id": 0})
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    body = await request.json()
    data = body.get("data", {})
    
    result = await db.agent_collections.update_one(
        {"agent_id": agent_id, "collection_name": collection_name, "item_id": item_id},
        {"$set": {"data": data, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    
    updated = await db.agent_collections.find_one(
        {"agent_id": agent_id, "collection_name": collection_name, "item_id": item_id},
        {"_id": 0}
    )
    return updated


@api_router.delete("/agents/{agent_id}/collections/{collection_name}/items/{item_id}")
async def delete_collection_item(agent_id: str, collection_name: str, item_id: str, request: Request):
    """Delete an item from a collection"""
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    
    # Verify agent ownership
    agent = await db.agents.find_one({"agent_id": agent_id, "client_id": user_id}, {"_id": 0})
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    result = await db.agent_collections.delete_one(
        {"agent_id": agent_id, "collection_name": collection_name, "item_id": item_id}
    )
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    
    return {"message": "Item deleted successfully"}


# ─── CSV Auto-Detection & Bulk Upload ───

@api_router.post("/agents/{agent_id}/collections/{collection_name}/detect-csv")
async def detect_csv_schema(agent_id: str, collection_name: str, request: Request):
    """
    Upload CSV and auto-detect schema
    Returns detected fields and sample data for user confirmation
    """
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    
    # Verify agent ownership
    agent = await db.agents.find_one({"agent_id": agent_id, "client_id": user_id}, {"_id": 0})
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    body = await request.json()
    csv_content = body.get("csv_content", "")
    
    if not csv_content:
        raise HTTPException(status_code=400, detail="csv_content is required")
    
    try:
        headers, detected_fields, sample_data = parse_csv_and_detect_schema(csv_content)
        
        return {
            "headers": headers,
            "detected_fields": detected_fields,
            "sample_data": sample_data,
            "total_rows": len(csv_content.strip().split('\n')) - 1  # Exclude header
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {str(e)}")


@api_router.post("/agents/{agent_id}/collections/{collection_name}/bulk-upload")
async def bulk_upload_csv(agent_id: str, collection_name: str, request: Request):
    """
    Bulk upload items from CSV
    Replaces ALL existing data in the collection
    """
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    
    # Verify agent ownership
    agent = await db.agents.find_one({"agent_id": agent_id, "client_id": user_id}, {"_id": 0})
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # Verify schema exists
    schema = await db.agent_schemas.find_one(
        {"agent_id": agent_id, "collection_name": collection_name},
        {"_id": 0}
    )
    if not schema:
        raise HTTPException(status_code=404, detail="Schema not found")
    
    body = await request.json()
    csv_content = body.get("csv_content", "")
    replace_existing = body.get("replace_existing", True)
    
    if not csv_content:
        raise HTTPException(status_code=400, detail="csv_content is required")
    
    try:
        # Parse CSV
        reader = csv.DictReader(io.StringIO(csv_content))
        rows = list(reader)
        
        if not rows:
            raise HTTPException(status_code=400, detail="CSV has no data rows")
        
        # Delete existing data if replace mode
        if replace_existing:
            await db.agent_collections.delete_many({
                "agent_id": agent_id,
                "collection_name": collection_name
            })
        
        # Prepare items for bulk insert
        now = datetime.now(timezone.utc).isoformat()
        items_to_insert = []
        
        for row in rows:
            # Clean field names (convert to lowercase with underscores)
            cleaned_data = {}
            for key, value in row.items():
                clean_key = key.strip().lower().replace(" ", "_")
                
                # Type conversion based on schema
                field_def = next((f for f in schema["fields"] if f["field_name"] == clean_key), None)
                if field_def:
                    field_type = field_def["field_type"]
                    
                    # Convert value based on type
                    if field_type == "number":
                        try:
                            cleaned_data[clean_key] = float(value.replace(",", "")) if value else 0
                        except:
                            cleaned_data[clean_key] = 0
                    elif field_type == "checkbox":
                        cleaned_data[clean_key] = value.lower() in ["yes", "true", "1", "y"]
                    elif field_type == "date":
                        cleaned_data[clean_key] = value  # Keep as string for now
                    else:
                        cleaned_data[clean_key] = value
                else:
                    cleaned_data[clean_key] = value
            
            item_doc = {
                "agent_id": agent_id,
                "collection_name": collection_name,
                "item_id": f"item_{uuid.uuid4().hex[:12]}",
                "data": cleaned_data,
                "created_at": now,
                "updated_at": now
            }
            items_to_insert.append(item_doc)
        
        # Bulk insert
        if items_to_insert:
            await db.agent_collections.insert_many(items_to_insert)
        
        return {
            "message": f"Successfully uploaded {len(items_to_insert)} items",
            "items_count": len(items_to_insert),
            "replaced_existing": replace_existing
        }
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to upload CSV: {str(e)}")


# ─── Output: Leads ───

@api_router.post("/agents/{agent_id}/leads")
async def create_lead(agent_id: str, request: Request):
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    agent = await db.agents.find_one({"agent_id": agent_id, "client_id": user_id}, {"_id": 0})
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    body = await request.json()
    lead_id = f"LEAD-{uuid.uuid4().hex[:8].upper()}"
    now = datetime.now(timezone.utc).isoformat()
    lead = {
        "lead_id": lead_id, "agent_id": agent_id, "client_id": user_id,
        "customer_name": body.get("customer_name", ""),
        "phone": body.get("phone", ""),
        "email": body.get("email", ""),
        "details": body.get("details", ""),
        "source": body.get("source", "chat"),
        "status": "new",
        "created_at": now, "updated_at": now,
    }
    await db.leads.insert_one(lead)
    lead.pop("_id", None)
    return lead

@api_router.get("/agents/{agent_id}/leads")
async def list_leads(agent_id: str, request: Request):
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    leads = await db.leads.find({"agent_id": agent_id, "client_id": user_id}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return leads

@api_router.patch("/agents/{agent_id}/leads/{lead_id}/status")
async def update_lead_status(agent_id: str, lead_id: str, request: Request):
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    body = await request.json()
    new_status = body.get("status", "")
    valid = ["new", "contacted", "qualified", "converted", "lost"]
    if new_status not in valid:
        raise HTTPException(status_code=400, detail=f"Status must be one of: {valid}")
    await db.leads.update_one({"lead_id": lead_id, "agent_id": agent_id, "client_id": user_id}, {"$set": {"status": new_status, "updated_at": datetime.now(timezone.utc).isoformat()}})
    updated = await db.leads.find_one({"lead_id": lead_id}, {"_id": 0})
    return updated


# ─── Output: Customer Tickets (ISP/Telecom) ───

@api_router.post("/agents/{agent_id}/customer-tickets")
async def create_customer_ticket(agent_id: str, request: Request):
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    agent = await db.agents.find_one({"agent_id": agent_id, "client_id": user_id}, {"_id": 0})
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    body = await request.json()
    ticket_id = f"CTKT-{uuid.uuid4().hex[:8].upper()}"
    now = datetime.now(timezone.utc).isoformat()
    ticket = {
        "ticket_id": ticket_id, "agent_id": agent_id, "client_id": user_id,
        "customer_name": body.get("customer_name", ""),
        "phone": body.get("phone", ""),
        "issue": body.get("issue", ""),
        "category": body.get("category", "general"),
        "priority": body.get("priority", "medium"),
        "status": "open",
        "created_at": now, "updated_at": now,
    }
    await db.customer_tickets.insert_one(ticket)
    ticket.pop("_id", None)
    return ticket

@api_router.get("/agents/{agent_id}/customer-tickets")
async def list_customer_tickets(agent_id: str, request: Request):
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    tickets = await db.customer_tickets.find({"agent_id": agent_id, "client_id": user_id}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return tickets

@api_router.patch("/agents/{agent_id}/customer-tickets/{ticket_id}/status")
async def update_customer_ticket_status(agent_id: str, ticket_id: str, request: Request):
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    body = await request.json()
    new_status = body.get("status", "")
    valid = ["open", "in_progress", "resolved", "closed"]
    if new_status not in valid:
        raise HTTPException(status_code=400, detail=f"Status must be one of: {valid}")
    await db.customer_tickets.update_one({"ticket_id": ticket_id, "agent_id": agent_id}, {"$set": {"status": new_status, "updated_at": datetime.now(timezone.utc).isoformat()}})
    updated = await db.customer_tickets.find_one({"ticket_id": ticket_id}, {"_id": 0})
    return updated


# ─── Notifications ───
@api_router.get("/notifications")
async def list_notifications(request: Request):
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    notifications = await db.notifications.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return notifications

@api_router.get("/notifications/unread-count")
async def unread_notification_count(request: Request):
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    count = await db.notifications.count_documents({"user_id": user_id, "read": False})
    return {"count": count}

@api_router.patch("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, request: Request):
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    await db.notifications.update_one(
        {"notification_id": notification_id, "user_id": user_id},
        {"$set": {"read": True}}
    )
    return {"message": "Marked as read"}

@api_router.post("/notifications/mark-all-read")
async def mark_all_notifications_read(request: Request):
    user = await get_current_user(request)
    user_id = user.get("user_id") or str(user.get("_id", ""))
    await db.notifications.update_many(
        {"user_id": user_id, "read": False},
        {"$set": {"read": True}}
    )
    return {"message": "All marked as read"}


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
    await db.channels.create_index("agent_id")
    await db.faqs.create_index("agent_id")
    await db.documents.create_index("agent_id")
    await db.products.create_index("agent_id")
    await db.conversations.create_index("agent_id")
    await db.messages.create_index("conv_id")
    await db.payments.create_index("user_id")
    await db.orders.create_index([("client_id", 1), ("created_at", -1)])
    await db.notifications.create_index([("user_id", 1), ("created_at", -1)])
    await db.notifications.create_index([("user_id", 1), ("read", 1)])
    await db.rooms.create_index("agent_id")
    await db.bookings.create_index([("client_id", 1), ("created_at", -1)])
    await db.bookings.create_index("agent_id")

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
