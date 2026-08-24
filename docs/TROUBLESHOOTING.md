# NexusResearch Troubleshooting Guide

This guide covers common errors, root causes, and verified solutions.

---

## 1. "Research Service Notice: Research service error"

### Symptom
When submitting a query in the frontend, an error banner appears stating:
*"Research Service Notice: Research service error. Please refine your query."*

### Root Causes & Solutions
1. **Backend Service Not Running or Unreachable:**
   - **Check:** Verify backend container health with `curl http://127.0.0.1:8000/api/v1/health` (local) or your Railway backend URL.
   - **Fix:** Start the backend with `python backend/run.py` or verify Railway service logs.
2. **Missing `reportlab` Dependency in Docker Container:**
   - **Check:** Look for `ModuleNotFoundError: No module named 'reportlab'` in server logs.
   - **Fix:** Ensure `reportlab>=4.0.0` is present in `backend/requirements.txt`.
3. **Invalid `$PORT` Environment Parsing:**
   - **Check:** Look for `ValueError: invalid literal for int() with base 10: '$PORT'`.
   - **Fix:** Use `backend/run.py` as the entrypoint, which programmatically parses `int(os.environ.get("PORT", 8000))`.
4. **Zero Scholarly Sources Found:**
   - **Check:** Query may be extremely obscure or empty.
   - **Fix:** The frontend now displays the specific error reason and provides a **`[Retry Research]`** button.

---

## 2. NextAuth / Google OAuth Login Errors

### Symptom
Clicking "Continue with Google" returns `OAuthCallbackError` or redirects back without logging in.

### Solutions
1. **Verify Authorized Redirect URIs:**
   - In [Google Cloud Console > Credentials](https://console.cloud.google.com/apis/credentials), ensure Authorized Redirect URIs includes:
     - `http://localhost:3000/api/auth/callback/google` (local dev)
     - `https://<your-production-domain>/api/auth/callback/google` (production)
2. **Set `AUTH_TRUST_HOST=true`:**
   - When running behind a reverse proxy (Railway, Nginx, Vercel), set `AUTH_TRUST_HOST=true` in environment variables.
3. **Check `AUTH_SECRET`:**
   - Ensure `AUTH_SECRET` is defined in `.env.local` / cloud environment variables.

---

## 3. Database Connection Issues

### Symptom
Server logs show `OperationalError: could not connect to server` or `no such table: users`.

### Solutions
1. **Local SQLite Path:**
   - For local development, set `DATABASE_URL=sqlite:///./nexusai_research.db`.
2. **PostgreSQL Network Name:**
   - Inside Docker Compose, use `postgresql://nexus:password@postgres:5432/nexusai_db`.
   - On Railway, use the private domain `postgresql://postgres:...@postgres.railway.internal:5432/railway`.
3. **Table Auto-Creation:**
   - The application automatically calls `init_db()` upon startup. If manual migration is needed, run `alembic upgrade head`.

---

## 4. Frontend Build or Type Errors

### Symptom
`npm run build` fails with TypeScript or Webpack errors.

### Solutions
1. **Clear Next.js Cache:**
   ```bash
   rm -rf .next
   npm run build
   ```
2. **Node Version Compatibility:**
   - Ensure Node.js is v18.17+ or v20+.
