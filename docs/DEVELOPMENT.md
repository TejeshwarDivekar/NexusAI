# NexusResearch Local Development Guide

## Prerequisites
- **Node.js:** v18.17+ or v20+ (with `npm`)
- **Python:** v3.10+ (with `pip` or virtual environment)
- **Git**
- *(Optional)* Docker & Docker Compose for containerized testing

---

## 1. Environment Setup

### Frontend Environment
1. In the project root, copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```
2. Set your environment variables in `.env.local`:
   ```bash
   # Generated with `npx auth secret`
   AUTH_SECRET=your_auth_secret_here
   AUTH_TRUST_HOST=true
   NEXTAUTH_URL=http://localhost:3000

   # Google Gemini API Key (from https://aistudio.google.com)
   GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key_here

   # Internal proxy target
   BACKEND_INTERNAL_URL=http://127.0.0.1:8000
   ```

### Backend Environment
1. In `backend/`, copy the backend environment file:
   ```bash
   cp backend/.env.example backend/.env
   ```
2. Set your backend environment variables:
   ```bash
   SECRET_KEY=your-super-secret-hex-key-here-minimum-32-characters
   GOOGLE_API_KEY=your_gemini_api_key_here
   DATABASE_URL=sqlite:///./nexusai_research.db
   ENVIRONMENT=development
   LOG_LEVEL=INFO
   ```

---

## 2. Installation & Running Locally

### Step 1: Install Dependencies
```bash
# Frontend dependencies
npm install

# Backend dependencies
cd backend
pip install -r requirements.txt
cd ..
```

### Step 2: Run the Backend
From the repository root:
```bash
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
# Or navigate to backend/ and run:
cd backend && python run.py
```
Backend Swagger API documentation will be available at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

### Step 3: Run the Frontend
In a separate terminal window from the repository root:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 3. Running Tests

### Backend Test Suite (Pytest)
Run all 30 unit, integration, and security isolation tests:
```bash
python -m pytest backend/tests -v
```

### Frontend Typecheck & Build
Validate Next.js compilation and TypeScript types:
```bash
npm run build
```

---

## 4. Code Standards & Linting
- **Frontend:** ESLint 9 with Next.js App Router rules: `npm run lint`.
- **Backend:** PEP 8 Python standards with type annotations and structured logging.
- **Git Commits:** Conventional Commits format (`feat:`, `fix:`, `chore:`, `docs:`).
