# NexusResearch Deployment Guide

## Overview
NexusResearch is configured for deployment on modern cloud platforms, including **Railway**, **Docker Compose**, and **Vercel + Cloud Backend**.

---

## 1. Railway Production Deployment

NexusResearch is configured with two Railway services and a PostgreSQL database in a single project.

### Architecture Topology
1. **Frontend Service (`frontend`):**
   - **Root Directory:** `/` (repository root)
   - **Build Command:** `npm run build`
   - **Start Command:** `npm run start`
   - **Variables:**
     - `BACKEND_INTERNAL_URL=http://backend.railway.internal:8000`
     - `AUTH_SECRET=<32-char-random-secret>`
     - `AUTH_TRUST_HOST=true`
     - `NEXTAUTH_URL=https://<your-frontend-domain>.up.railway.app`
     - `AUTH_GOOGLE_ID=<google-client-id>`
     - `AUTH_GOOGLE_SECRET=<google-client-secret>`

2. **Backend Service (`backend`):**
   - **Root Directory:** `backend`
   - **Dockerfile:** `Dockerfile` (or `Dockerfile.backend`)
   - **Start Command:** `python run.py`
   - **Healthcheck Path:** `/api/v1/health` (Timeout: 120s)
   - **Variables:**
     - `DATABASE_URL=postgresql://postgres:...@postgres.railway.internal:5432/railway`
     - `SECRET_KEY=<32-char-random-secret>`
     - `GOOGLE_API_KEY=<gemini-api-key>`
     - `GOOGLE_GENERATIVE_AI_API_KEY=<gemini-api-key>`
     - `ENVIRONMENT=production`
     - `LOG_LEVEL=INFO`
     - `CORS_ORIGINS=["*"]`

3. **PostgreSQL Database:**
   - Standard managed Railway Postgres instance.

---

## 2. Docker Compose Deployment (Self-Hosted / Single Server)

You can run the full multi-service stack with a single command:

```bash
# 1. Clone the repository
git clone https://github.com/TejeshwarDivekar/NexusAI.git
cd NexusAI

# 2. Copy and configure environment variables
cp .env.example .env.local

# 3. Start PostgreSQL, FastAPI Backend, and Next.js Frontend
docker compose up -d --build
```

### Verified Service Ports
- **Frontend Web UI:** `http://localhost:3000`
- **Backend API & Swagger:** `http://localhost:8000` / `http://localhost:8000/docs`
- **PostgreSQL:** `localhost:5432`

---

## 3. Production Environment Checklist
- [x] HTTPS enabled on public domains.
- [x] Strong JWT `SECRET_KEY` and `AUTH_SECRET` configured.
- [x] Valid Gemini API key configured with model access.
- [x] OAuth redirect URIs set in Google Cloud Console (`https://<domain>/api/auth/callback/google`).
- [x] Automatic container restart policy set to `ON_FAILURE`.
- [x] Healthcheck endpoint `/api/v1/health` active.
