# Here are your Instructions

## Nurekha

Nurekha is a full-stack web app with:
- **Backend:** Python **FastAPI** server (in `backend/`)
- **Frontend:** React app (Create React App) using **CRACO**, **Tailwind CSS**, and Radix UI components (in `frontend/`)
- **Business-type schemas:** Centralized definitions for **13 business types** (in `backend/schemas.py`) that drive fields + CSV headers per business type.

## Repo structure

- `backend/` — FastAPI backend (main server + schema definitions)
- `frontend/` — React frontend (CRACO-based)
- `sample_csv/` — example CSV files (for importing/testing)
- `tests/`, `backend/tests/`, `test_reports/` — tests and reports (if present/used)
- `CSV_DOCUMENTATION.md` — CSV format notes (see this for imports)
- `13_BUSINESS_TYPES_README.md` — details about supported business types
- `USER_VERIFICATION_GUIDE.md` — user verification guidance
- `CNAME` — GitHub Pages / custom domain configuration (if used)

## Supported business types (schemas)

The backend defines schemas in `backend/schemas.py`. Each business type provides:
- collection name
- a display label/icon
- an action type (e.g., `order`, `booking`, `lead`, `ticket`)
- a list of fields used by the UI / validation
- expected CSV headers for import

Business types currently include:
- `ecommerce`
- `hotel`
- `travel`
- `real_estate`
- `isp`
- `telecom`
- `restaurant`
- `service`
- `vehicle`
- `finance`
- `events`
- `education`
- `healthcare`

## Tech stack

### Backend
- FastAPI + Uvicorn
- Pydantic v2
- MongoDB driver (`motor`)
- Auth/security libs (bcrypt, JWT)

Backend dependencies are pinned in: `backend/requirements.txt`.

### Frontend
- React (CRA) + CRACO
- Tailwind CSS
- React Router
- Radix UI component library
- Axios

Frontend deps/scripts are in: `frontend/package.json`.

## Setup (local development)

### 1) Backend

```bash
cd backend
python -m venv .venv
# activate venv (platform-specific)
pip install -r requirements.txt
uvicorn server:app --reload
```

Notes:
- The backend entrypoint is `backend/server.py`.
- Create a `backend/.env` with required environment variables (MongoDB URL, DB name, JWT secret, etc.).

### 2) Frontend

```bash
cd frontend
yarn install
yarn start
```

Frontend starts via CRACO and typically runs at `http://localhost:3000`.

## CSV imports

If your workflow includes CSV import/export, check:
- `CSV_DOCUMENTATION.md`
- `sample_csv/`
- `backend/schemas.py` for the authoritative `csv_headers` per business type

## Documentation

- `13_BUSINESS_TYPES_README.md` — overview of the 13 schema types
- `CSV_DOCUMENTATION.md` — CSV columns and rules
- `USER_VERIFICATION_GUIDE.md` — verification flow/notes

## License

Add a license if you plan to open-source this project.
