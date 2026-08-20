import os
import time
import uuid
import uvicorn
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

load_dotenv()

from app.config import settings
from app.core.logging import logger
from app.core.exceptions import AppException
from app.db.database import engine, Base
from app.db.init_db import init_and_upgrade_db
from app.routers import health, auth, projects, documents, sources, research, conversations

# Safely initialize and migrate tables & columns without data loss
init_and_upgrade_db()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request Timing & Correlation ID Middleware
@app.middleware("http")
async def request_middleware(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    request.state.request_id = request_id
    start_time = time.time()

    response = await call_next(request)

    duration_ms = round((time.time() - start_time) * 1000, 2)
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Process-Time-MS"] = str(duration_ms)

    logger.info(
        f"{request.method} {request.url.path} - Status: {response.status_code} - {duration_ms}ms"
    )
    return response

# Custom Application Exception Handler
@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.error_code,
                "message": exc.detail,
                "request_id": getattr(request.state, "request_id", None)
            }
        },
        headers=exc.headers
    )

# Global Unhandled Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled exception during {request.method} {request.url.path}: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected internal server error occurred.",
                "request_id": getattr(request.state, "request_id", None)
            }
        }
    )

# Register API Routers
app.include_router(health.router, prefix=settings.API_V1_STR)
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(conversations.router, prefix=settings.API_V1_STR)
app.include_router(projects.router, prefix=settings.API_V1_STR)
app.include_router(documents.router, prefix=settings.API_V1_STR)
app.include_router(sources.router, prefix=settings.API_V1_STR)
app.include_router(research.router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "operational",
        "api_v1": settings.API_V1_STR,
        "features": [
            "User Isolated Conversations",
            "Multi-Source Academic Pipeline (OpenAlex, PubMed, Europe PMC, Crossref)",
            "Deterministic Evidence Extraction",
            "Contradiction Auditing",
            "IEEE Word Document Generation"
        ]
    }
