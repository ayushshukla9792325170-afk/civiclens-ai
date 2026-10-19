# CivicLens AI — Municipal Intelligence & Civic Issue Management Platform

![CivicLens AI Banner](frontend/public/logo.svg)

> **Empowering Citizens. Accelerating Municipal Resolution. Grounded in Transparent AI.**

CivicLens AI is a full-stack civic issue reporting, detection, spatial tracking, and municipal intelligence platform. Built with **React 19, TypeScript, Tailwind CSS v4, Leaflet, FastAPI, SQLAlchemy 2.0, and Google Gemini Multimodal AI**, the platform connects citizens, municipal field officers, and city administrators into a unified, accountable workflow.

---

## 🌟 Key Capabilities

### 1. Multimodal Citizen Intake (5-Step Wizard)
- **Photo Evidence & Camera Integration:** Direct image upload or camera capture with client-side preview and MIME/size validation.
- **Voice-to-Text Dictation:** Real-time speech recognition in **English and Hindi** powered by the Web Speech API.
- **Interactive Spatial Location:** One-click GPS auto-locate with fallback to Pune Metro coordinates and draggable pin placement.
- **Transparent AI Triage:** Live server-side classification of issue category, severity rating, and responsible department with confidence metrics and human review before submission.
- **Mobile-First PWA:** Installable web application with service worker caching, responsive down to 320px screens.

### 2. Multi-Department Municipal Operations Desk
- **Queue Triage:** Filter complaints by status, category, severity, department, ward, and overdue SLA breaches.
- **Directed Complaint Lifecycle:** Enforces a strict, auditable lifecycle:
  $$\text{SUBMITTED} \longrightarrow \text{VERIFIED} \longrightarrow \text{ASSIGNED} \longrightarrow \text{IN\_PROGRESS} \longrightarrow \text{RESOLVED} \longrightarrow \text{CITIZEN\_VERIFIED}$$
  *(Direct status jumps or unexplained rejections are blocked by server-side validators).*
- **Human-in-the-Loop Override:** Officers can override AI-recommended categories, severity, or routing with mandatory justification logs.
- **Resolution Proof Enforcement:** Municipal officers must upload photographic proof of remediation before marking an issue resolved.
- **Citizen Verification Loop:** Citizens inspect remediation on-site, verify closure, or reopen with mandatory feedback and 1-5 star ratings.

### 3. Spatial & Temporal Deduplication Engine
- Automatic detection of duplicate complaints within a radial distance (default 150m) and temporal window (default 14 days) using the Haversine distance formula and title text similarity.
- Officers can review candidate pairs, view radial distance in meters, and confirm duplicates (merging alerts) or dismiss them.

### 4. Real-Time Operational Intelligence & Analytics
- Dynamic KPIs: Total complaints, resolution velocity, average turnaround hours, and overdue count.
- Recharts visualizations: Monthly submission vs. resolution trends, horizontal category distributions, and severity proportions.
- Geographic Hotspot Mapping: Interactive GIS map plotting clusters and pulsing hazard markers for critical incidents.

### 5. Central Municipal Administration & Governance
- **Role-Based Access Control (RBAC):** Dedicated workspaces for Citizens, Officers, and Admins.
- **Last-Admin Protection:** Guard against system lockout by preventing demotion or deactivation of the sole remaining administrator.
- **Department & SLA Configuration:** Configure departments, target resolution turnaround times, and coverage wards.
- **Immutable Audit Trail:** Append-only logging of user status changes, role promotions, status overrides, and system settings.

---

## 🏗️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                          CivicLens Client Web App                      │
│            React 19 + TypeScript + Vite + Tailwind CSS v4 + PWA        │
├─────────────────────────┬──────────────────────────┬───────────────────┤
│    Citizen Portal       │   Officer Operations     │   Admin Central   │
│  • 5-Step Report Wizard │ • Incident Queue & Desk  │ • User Directory  │
│  • Voice Dictation      │ • Proof Upload & Triage  │ • SLA Settings    │
│  • Resolution Verify    │ • Duplicate Management   │ • Audit Trail     │
└─────────────────────────┴────────────┬─────────────┴───────────────────┘
                                       │ HTTP REST / WebSocket
                                       ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        FastAPI Application Gateway                     │
│                  Python 3.12/3.14 + Pydantic v2 + Uvicorn              │
├──────────────────────────┬───────────────────────────┬─────────────────┤
│ • JWT Bearer Auth        │ • RBAC Dependency Guards  │ • WebSocket Hub │
│ • State Machine Engine   │ • Haversine Clustering    │ • Audit Logger  │
└────────────┬─────────────┴─────────────┬─────────────┴─────────────────┘
             │                           │
             ▼                           ▼
┌──────────────────────────┐  ┌──────────────────────────────────────────┐
│  Multimodal AI Pipeline  │  │      Relational Persistence Layer        │
├──────────────────────────┤  ├──────────────────────────────────────────┤
│ • Gemini 1.5/2.0 Vision  │  │ • PostgreSQL (Supabase) / SQLite         │
│ • Gemini Text Reasoning  │  │ • SQLAlchemy 2.0 ORM                     │
│ • Deterministic Fallback │  │ • Alembic Schema Migrations              │
└──────────────────────────┘  └──────────────────────────────────────────┘
```

---

## 💻 Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, React Router v7, Leaflet, Recharts, Lucide Icons |
| **Backend** | Python 3.12 / 3.14, FastAPI, Pydantic v2, SQLAlchemy 2.0, Alembic, Passlib / Bcrypt, PyJWT |
| **AI Engine** | Google Gemini Multimodal Vision API + Deterministic Rule-Based Fallback Engine |
| **Databases** | PostgreSQL 16+ (Supabase) / SQLite 3 |
| **DevOps** | Docker, Docker Compose, Nginx, Vercel / Render compatibility |

---

## ⚡ Quickstart Guide (Local Development)

### 1. Clone the repository
```bash
git clone https://github.com/your-org/civiclens-ai.git
cd civiclens-ai
```

### 2. Backend Setup
```powershell
cd backend

# Create virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1   # On macOS/Linux: source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations and seed data (5 departments, 6 wards, 24 complaints, demo users)
alembic upgrade head
python scripts/seed.py

# Start backend server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
Interactive API documentation: `http://localhost:8000/docs`

### 3. Frontend Setup
In a new terminal:
```bash
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## 👥 Demo User Credentials

The application is pre-seeded with realistic demo accounts across all three user roles:

| Role | Email | Password | Primary Scope |
| :--- | :--- | :--- | :--- |
| **System Administrator** | `admin@civiclens.gov` | `Admin@12345` | Global Municipal Platform Control |
| **PWD Officer** | `officer.pwd@civiclens.gov` | `Officer@12345` | Roads, Potholes & Bridges (PWD) |
| **Sanitation Officer** | `officer.swm@civiclens.gov` | `Officer@12345` | Solid Waste Management (SWM) |
| **Electrical Officer** | `officer.elec@civiclens.gov` | `Officer@12345` | Streetlights & Power (ELEC) |
| **Citizen (Aarav)** | `citizen.aarav@example.com` | `Citizen@12345` | Citizen Reporting & Verification |

*Tip: The Login page provides 1-click quick login buttons to switch roles instantly.*

---

## 🧪 Automated Testing

### Run Backend Pytest Suite:
```powershell
cd backend
.\.venv\Scripts\pytest -v tests/test_api.py
```
**Results:** `13/13 tests passing (Health check, Auth, AI fallback, RBAC, Status DAG, Deduplication, Rejection enforcement, Settings)`.

### Run Frontend Production Build:
```powershell
cd frontend
npm run build
```
**Results:** `2,587 modules transformed, 0 TypeScript errors, bundle generated in dist/`.

---

## 🐳 Docker Deployment

To spin up the entire platform (PostgreSQL database, FastAPI backend, and React frontend) using Docker Compose:
```bash
docker-compose up --build
```
Access the application at `http://localhost`.

---

## 📚 Technical Documentation

Detailed architectural and deployment guides are available in the [`docs/`](docs/) directory:

- 📐 [**Architecture Blueprint**](docs/architecture.md): Complete subsystem design and data flow diagrams.
- 🗄️ [**Database Schema**](docs/database-schema.md): Entity-relationship diagrams and table specifications.
- 🔌 [**REST API Reference**](docs/api-guide.md): OpenAPI endpoint documentation and payload samples.
- 🛠️ [**Setup & Installation Guide**](docs/setup-guide.md): Step-by-step local development setup.
- 🚀 [**Production Deployment Guide**](docs/deployment-guide.md): Deploying to Vercel, Render, and Supabase.
- 🛡️ [**Security & Governance Notes**](docs/security-notes.md): Cryptographic practices, RBAC, and citizen privacy.

---

## 📄 License
This project is licensed under the MIT License — see the LICENSE file for details.
