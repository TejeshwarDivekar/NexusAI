from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.config import settings
from app.db.database import get_db
from app.schemas.common import HealthResponse
from app.core.logging import logger

router = APIRouter(tags=["System & Health"])


@router.get("/health", response_model=HealthResponse)
def health_check(db: Session = Depends(get_db)):
    """Health check endpoint verifying application status and database connectivity."""
    db_type = "postgresql" if "postgres" in settings.DATABASE_URL.lower() else "sqlite"
    
    # Verify active database connectivity
    db_status = "connected"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        db_status = "disconnected"

    return HealthResponse(
        app=settings.PROJECT_NAME,
        version=settings.VERSION,
        status="healthy" if db_status == "connected" else "degraded",
        environment=settings.ENVIRONMENT,
        database=f"{db_type} ({db_status})",
        docs_url=f"{settings.API_V1_STR}/openapi.json"
    )
