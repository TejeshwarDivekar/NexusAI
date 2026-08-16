from pydantic import BaseModel
from typing import Optional, Any

class HealthResponse(BaseModel):
    app: str
    version: str
    status: str
    environment: str
    database: str
    docs_url: str

class MessageResponse(BaseModel):
    message: str
    detail: Optional[str] = None
    success: bool = True
