import os
from typing import List
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# Load environment variables from .env file if present
load_dotenv()


class Settings(BaseModel):
    """Application runtime configuration and environment variables."""

    # Project Information
    PROJECT_NAME: str = Field(
        default="Enterprise AI Research Assistant API",
        description="Public title of the application",
    )
    VERSION: str = Field(default="1.0.0", description="API Version")
    API_V1_STR: str = Field(default="/api/v1", description="Prefix for API v1 routes")
    ENVIRONMENT: str = Field(
        default=os.getenv("ENVIRONMENT", "development"),
        description="Runtime environment: development, staging, or production",
    )
    LOG_LEVEL: str = Field(
        default=os.getenv("LOG_LEVEL", "INFO"),
        description="Standard logging level (DEBUG, INFO, WARNING, ERROR)",
    )

    # Security & Tokens
    SECRET_KEY: str = Field(
        default=os.getenv(
            "SECRET_KEY",
            "nexusai-production-super-secret-key-2026-secure-default",
        ),
        description="Cryptographic secret key for signing JWT tokens",
    )
    ALGORITHM: str = Field(default="HS256", description="JWT hashing algorithm")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(
        default=int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", str(60 * 24 * 7))),
        description="Access token TTL in minutes (default 7 days)",
    )

    # Database Configuration
    DATABASE_URL: str = Field(
        default=os.getenv("DATABASE_URL", "sqlite:///./nexusai_research.db"),
        description="Relational database connection string (PostgreSQL or SQLite)",
    )

    # External AI & Search Providers
    GOOGLE_API_KEY: str = Field(
        default=os.getenv("GOOGLE_GENERATIVE_AI_API_KEY", os.getenv("GOOGLE_API_KEY", "")),
        description="Google Gemini API key for embeddings and generation",
    )
    TAVILY_API_KEY: str = Field(
        default=os.getenv("TAVILY_API_KEY", ""),
        description="Tavily Search API key for web research",
    )
    OPENAI_API_KEY: str = Field(
        default=os.getenv("OPENAI_API_KEY", ""),
        description="OpenAI API key (optional fallback)",
    )

    # Document Upload Limits
    MAX_UPLOAD_SIZE_MB: int = Field(
        default=int(os.getenv("MAX_UPLOAD_SIZE_MB", "25")),
        description="Maximum allowed uploaded file size in megabytes",
    )
    ALLOWED_EXTENSIONS: List[str] = Field(
        default=[".pdf", ".txt", ".md", ".json", ".csv"],
        description="Permitted file extensions for ingestion",
    )

    # Cross-Origin Resource Sharing
    CORS_ORIGINS: List[str] = Field(
        default=["*"],
        description="Permitted CORS origins",
    )

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() == "production"

    @property
    def is_development(self) -> bool:
        return self.ENVIRONMENT.lower() == "development"


# Global singleton settings instance
settings = Settings()
