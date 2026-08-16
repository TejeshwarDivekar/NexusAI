# Enterprise AI Research Assistant — Backend Service

Production-oriented FastAPI backend service providing multi-source academic/web research orchestration, dense vector retrieval, deterministic claim verification, and conflict detection.

---

## Architecture & Technology Stack

- **Framework**: FastAPI (Python 3.10+) with async request handlers and Server-Sent Events (SSE).
- **Settings & Config**: Pydantic settings with type enforcement and environment segregation.
- **Structured Logging**: JSON formatting in production with request correlation IDs (`X-Request-ID`).
- **Database ORM**: SQLAlchemy 2.0 with normalized relational models and Alembic migrations.
- **Supported Databases**: PostgreSQL (Production) / SQLite (Local development).
- **Error Handling**: Standardized `AppException` hierarchy with HTTP status codes and error payloads.

---

## Directory Structure

```
backend/
├── alembic/                 # Database migrations
│   ├── env.py
│   └── script.py.mako
├── alembic.ini              # Alembic configuration
├── app/
│   ├── config.py            # Pydantic Settings & Environment loading
│   ├── main.py              # Application entrypoint & Middleware
│   ├── core/                # Core utilities (Logging, Exceptions, Security)
│   ├── db/                  # Database session & SQLAlchemy models
│   ├── routers/             # API v1 routes (health, auth, projects, documents, sources, research)
│   ├── schemas/             # Pydantic validation schemas
│   └── services/            # Research engine, Chunking, Evidence, Contradiction services
├── tests/                   # Pytest test suite
├── .env.example             # Environment template
└── Dockerfile.backend       # Container deployment
```

---

## Quickstart Guide

### 1. Environment Configuration
```bash
cp .env.example .env
# Configure your settings and API keys in .env
```

### 2. Run Database Migrations
```bash
alembic upgrade head
```

### 3. Start Development Server
```bash
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Interactive API documentation will be available at:
- **Swagger UI**: `http://localhost:8000/api/v1/docs`
- **ReDoc**: `http://localhost:8000/api/v1/redoc`
- **OpenAPI Schema**: `http://localhost:8000/api/v1/openapi.json`

---

## Running Automated Tests

```bash
python -m pytest tests/ -v
```
