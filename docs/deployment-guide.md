# CivicLens AI — Production Deployment Guide

This guide provides step-by-step instructions for deploying CivicLens AI to production using modern cloud platforms: **Vercel / Netlify** for the frontend, **Render / Railway / Fly.io** for the FastAPI backend, and **Supabase** for hosted PostgreSQL database and object storage.

---

## 1. Architecture Overview

- **Frontend:** Single-page application built with React, Vite, and Tailwind CSS. Deployed as static edge assets on Vercel or Netlify.
- **Backend:** High-throughput Python ASGI service with Uvicorn. Deployed on Render Web Service or Docker container on Railway.
- **Database:** Supabase managed PostgreSQL 16+ instance.
- **File Storage:** Local uploads directory or Supabase Storage bucket for complaint photos and resolution evidence.

---

## 2. Database Setup on Supabase

1. Create a new project in the [Supabase Dashboard](https://supabase.com).
2. Retrieve your database connection string under **Project Settings → Database → Connection string (URI)**.
   Format:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
   ```
3. In your backend environment, set:
   ```env
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
   ```
4. Run Alembic migrations against the production database:
   ```bash
   alembic upgrade head
   ```
5. *(Optional)* Seed initial departments, wards, and admin user:
   ```bash
   python scripts/seed.py
   ```

---

## 3. Backend Deployment (Render.com)

1. **Create a new Web Service** on [Render](https://dashboard.render.com).
2. Connect your Git repository.
3. Configure the service settings:
   - **Root Directory:** `backend`
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt && alembic upgrade head`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add the **Environment Variables**:
   ```env
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
   SECRET_KEY=[GENERATE_A_64_CHAR_RANDOM_HEX_KEY]
   ACCESS_TOKEN_EXPIRE_MINUTES=1440
   CORS_ORIGINS=https://your-civiclens-app.vercel.app
   UPLOAD_DIR=./uploads
   GEMINI_API_KEY=[YOUR_GOOGLE_AI_GEMINI_KEY]
   ```
5. Deploy the service. Verify deployment by pinging health check:
   ```bash
   curl https://your-backend.onrender.com/api/v1/health
   ```

---

## 4. Frontend Deployment (Vercel / Netlify)

### Option A: Vercel

1. In the [Vercel Dashboard](https://vercel.com), select **Add New Project** and link your repository.
2. Configure project settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Add Environment Variables:
   ```env
   VITE_API_BASE_URL=https://your-backend.onrender.com
   ```
4. Add SPA Routing Rewrites:
   Create `frontend/vercel.json` if not present:
   ```json
   {
     "rewrites": [
       { "source": "/api/(.*)", "destination": "https://your-backend.onrender.com/api/$1" },
       { "source": "/uploads/(.*)", "destination": "https://your-backend.onrender.com/uploads/$1" },
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```

### Option B: Netlify

Create `frontend/netlify.toml`:
```toml
[build]
  base = "frontend"
  publish = "dist"
  command = "npm run build"

[[redirects]]
  from = "/api/*"
  to = "https://your-backend.onrender.com/api/:splat"
  status = 200

[[redirects]]
  from = "/uploads/*"
  to = "https://your-backend.onrender.com/uploads/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

## 5. Security Checklist for Production

- [x] Change the default `SECRET_KEY` to a cryptographically secure random string.
- [x] Set `CORS_ORIGINS` strictly to your production domain (avoid wildcards `*`).
- [x] Enforce HTTPS on both frontend and backend domains.
- [x] Restrict database access so only backend server IPs can connect directly.
- [x] Set automated backup schedules for PostgreSQL in Supabase.
- [x] Set an alert threshold for API error rates and SLA compliance.
