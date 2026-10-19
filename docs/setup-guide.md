# CivicLens AI — Local Development & Setup Guide

This guide covers setting up and running CivicLens AI locally on Windows, macOS, or Linux.

---

## 1. Prerequisites

- **Python:** 3.12 or newer (tested with Python 3.14).
- **Node.js:** 18.x or newer (recommended 20+).
- **npm:** 9.x or newer.
- **Git**

---

## 2. Backend Setup (`/backend`)

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create and activate a virtual environment:**
   - **Windows (PowerShell):**
     ```powershell
     python -m venv .venv
     .\.venv\Scripts\Activate.ps1
     ```
   - **macOS / Linux:**
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment Variables Configuration (`backend/.env`):**
   Copy `.env.example` to `.env`:
   ```env
   # Database (defaults to local SQLite for instant setup; or PostgreSQL/Supabase URL)
   DATABASE_URL=sqlite:///./civiclens.db

   # Security & Authentication
   SECRET_KEY=civiclens-dev-secret-key-change-in-production-super-secret-2026
   ACCESS_TOKEN_EXPIRE_MINUTES=1440

   # CORS allowed origins (comma-separated)
   CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

   # Evidence storage directory
   UPLOAD_DIR=./uploads

   # Optional Gemini Multimodal AI (system transparently falls back to rule-based engine if empty)
   GEMINI_API_KEY=
   ```

5. **Run database migrations:**
   ```bash
   alembic upgrade head
   ```

6. **Seed realistic demo data:**
   Populates 5 departments, 6 Pune wards, 9 users across all roles, 24 realistic complaints in various lifecycle states, photo evidence, duplicate candidates, and audit logs:
   ```bash
   python scripts/seed.py
   ```

7. **Start the FastAPI backend server:**
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
   The backend API documentation is interactively available at:
   - Swagger UI: `http://localhost:8000/docs`
   - ReDoc: `http://localhost:8000/redoc`

---

## 3. Frontend Setup (`/frontend`)

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install node dependencies:**
   ```bash
   npm install
   ```

3. **Environment Variables (`frontend/.env`):**
   Create a `.env` file if not already present:
   ```env
   VITE_API_BASE_URL=
   ```
   *(When left empty, Vite proxies all `/api`, `/uploads`, and `/ws` requests directly to `http://localhost:8000`)*

4. **Start the Vite development server:**
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:5173`.

5. **Verify frontend production build:**
   ```bash
   npm run build
   ```

---

## 4. Pre-configured Demo Accounts

Use these pre-seeded accounts to experience all role workspaces immediately:

| Role | Email | Password | Primary Jurisdiction |
| :--- | :--- | :--- | :--- |
| **System Administrator** | `admin@civiclens.gov` | `Admin@12345` | Global Platform & Governance |
| **PWD Officer** | `officer.pwd@civiclens.gov` | `Officer@12345` | Roads, Potholes & Bridges (PWD) |
| **Sanitation Officer** | `officer.swm@civiclens.gov` | `Officer@12345` | Waste & Garbage Management (SWM) |
| **Electrical Officer** | `officer.elec@civiclens.gov` | `Officer@12345` | Streetlights & Power Grids (ELEC) |
| **Citizen (Aarav)** | `citizen.aarav@example.com` | `Citizen@12345` | Pune Ward 01 (Shivajinagar) |
| **Citizen (Pooja)** | `citizen.pooja@example.com` | `Citizen@12345` | Pune Ward 02 (Kothrud) |

*Tip: The Login page includes one-click demo login buttons for instant access without manual typing.*

---

## 5. Automated Test Suite

Run the full pytest suite in `backend/`:
```bash
cd backend
.\.venv\Scripts\pytest -v tests/test_api.py
```
Expected output: `13 passed in ~2.5s`
