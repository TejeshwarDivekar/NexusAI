# NexusResearch

An enterprise-grade AI research assistant for grounded literature retrieval, interactive evidence exploration, contradiction analysis, and publication-ready IEEE Word (`.docx`) and academic PDF report generation.

---

## Features

- **Multi-Registry Academic Retrieval:** Concurrently queries real academic and web registries (OpenAlex, arXiv, PubMed, Europe PMC, Crossref, Wikipedia, DuckDuckGo).
- **Hard Relevance Gating:** Filters irrelevant search candidates using multi-factor lexical and semantic scoring before evidence extraction.
- **Sentence-Level Grounding:** Extracts grounded evidence items with explicit quotation citations and empirical claim classifications.
- **Interactive Evidence Matrix:** Inspect specific evidence items in the center panel with on-demand AI explanations while preserving research report state.
- **Contradiction Detection:** Audits discrepancies, methodological differences, and opposing findings across sources.
- **Publication-Ready Export:** Compiles publication-grade IEEE standard Word documents (`.docx`) and academic PDFs (`.pdf`) with verified citations.
- **Multi-Tenant User Isolation:** Full data isolation for projects, research history, uploaded documents, and generated assets.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      Next.js 16 App Router (Frontend)                   │
│  - Launchpad & Query Composer                                           │
│  - Research Workspace & Tabbed Center Panel                             │
│  - Interactive Evidence Matrix & Detail Inspector with Scroll Restoral │
│  - Document Downloader (IEEE Word & Academic PDF)                       │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                    Reverse Proxy & /api/v1/... (SSE & REST)
                                     │
┌────────────────────────────────────▼────────────────────────────────────┐
│                       FastAPI 0.115 (Backend Core)                      │
│  - Lifespan Engine, Structured Logging & JWT / OAuth Sync              │
│  - 7-Stage Research Engine (classify, search, filter, extract, audit,   │
│    data analysis, synthesis)                                            │
│  - Academic PDF & IEEE Word Compilers with Citation Validation         │
└───────────────────┬─────────────────────────────────┬───────────────────┘
                    │                                 │
     ┌──────────────▼──────────────┐   ┌──────────────▼───────────────────┐
     │   PostgreSQL / SQLite DB    │   │      External APIs & Registry    │
     │ - Users & Active Projects   │   │ - OpenAlex, arXiv, PubMed        │
     │ - Conversations & Tasks     │   │ - Europe PMC, Crossref           │
     │ - Sources & Evidence Items  │   │ - DuckDuckGo & Wikipedia         │
     │ - Ingested Context Chunks   │   │ - Google Gemini LLM Engine       │
     └─────────────────────────────┘   └──────────────────────────────────┘
```

---

## Technology Stack

- **Frontend:** Next.js 16.3.1 (React 19, TypeScript 5), Lucide Icons, React Markdown.
- **Backend:** FastAPI (Python 3.10+), Uvicorn, AsyncIO.
- **Database:** SQLAlchemy ORM, PostgreSQL / SQLite, Alembic.
- **AI & Search:** Google Gemini (`gemini-2.5-flash` / `gemini-1.5-pro`), OpenAlex API, arXiv API, PubMed API, Europe PMC API, Crossref API.
- **Document Generation:** `python-docx` (IEEE format), `reportlab` (Academic PDF).
- **Authentication:** Auth.js / NextAuth (Google & GitHub OAuth, Credentials), JWT (HS256).

---

## Prerequisites

- **Node.js:** v18.17+ or v20+
- **Python:** v3.10+
- **Google Gemini API Key:** From [Google AI Studio](https://aistudio.google.com)

---

## Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/TejeshwarDivekar/NexusAI.git
cd NexusAI
```

### 2. Configure Environment Variables
Copy the template configuration files:
```bash
# Frontend environment
cp .env.example .env.local

# Backend environment
cp backend/.env.example backend/.env
```

Fill in your required values:
```bash
# .env.local
AUTH_SECRET=generate-a-32-char-secret-with-npx-auth-secret
AUTH_TRUST_HOST=true
NEXTAUTH_URL=http://localhost:3000
GOOGLE_GENERATIVE_AI_API_KEY=your-gemini-api-key
BACKEND_INTERNAL_URL=http://127.0.0.1:8000
```

```bash
# backend/.env
SECRET_KEY=your-backend-secret-key-at-least-32-chars
GOOGLE_API_KEY=your-gemini-api-key
DATABASE_URL=sqlite:///./nexusai_research.db
ENVIRONMENT=development
LOG_LEVEL=INFO
```

---

## Local Development

### Run the Backend
```bash
cd backend
pip install -r requirements.txt
python run.py
```
Backend API and OpenAPI documentation will be available at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

### Run the Frontend
In a separate terminal window from the repository root:
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## Testing

Run the automated backend test suite (30 unit, integration, and security tests):
```bash
python -m pytest backend/tests -v
```

Validate the Next.js production build:
```bash
npm run build
```

---

## Deployment

### Railway Cloud Deployment
This repository is configured for direct deployment on Railway:
- **Frontend Service:** Runs `npm run build` and `npm run start` with `BACKEND_INTERNAL_URL=http://backend.railway.internal:8000`.
- **Backend Service:** Builds from `backend/Dockerfile` with entrypoint `python run.py` and health check `/api/v1/health`.
- **Database:** Managed PostgreSQL instance.

### Docker Compose
Run the entire stack locally in containers:
```bash
docker compose up -d --build
```

---

## Documentation

Detailed documentation is available in the [`docs/`](./docs) directory:
- [System Architecture](./docs/ARCHITECTURE.md)
- [Local Development Guide](./docs/DEVELOPMENT.md)
- [Database Schema](./docs/DATABASE.md)
- [API Reference](./docs/API.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [Troubleshooting](./docs/TROUBLESHOOTING.md)
- [Final Cleanup Audit Report](./docs/FINAL_CLEANUP_REPORT.md)

---

## Project Structure

```
NexusResearch/
├── backend/
│   ├── app/
│   │   ├── core/               # Logging, security, exception handlers
│   │   ├── db/                 # Database initialization, models, session
│   │   ├── routers/            # FastAPI route handlers (auth, research, etc.)
│   │   ├── schemas/            # Pydantic validation schemas
│   │   └── services/           # Research engine, search providers, doc gen
│   ├── tests/                  # Pytest test suite (30 tests)
│   ├── Dockerfile              # Container definition for backend
│   ├── requirements.txt        # Python dependencies
│   └── run.py                  # Uvicorn programmatic entrypoint
├── docs/                       # Technical architecture & deployment guides
├── public/                     # Static assets and icons
├── scripts/                    # Documentation and validation scripts
├── src/
│   ├── app/                    # Next.js App Router pages and API routes
│   ├── components/             # React UI & Research Workspace components
│   └── lib/                    # Client utilities
├── docker-compose.yml          # Multi-container orchestration
├── package.json                # Frontend dependencies and scripts
└── README.md                   # Project overview
```

---

## License

This project is licensed under the MIT License.
