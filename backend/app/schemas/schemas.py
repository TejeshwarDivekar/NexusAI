# Re-export all schemas for backward compatibility and clean modular imports
from app.schemas.auth import UserRegister, UserLogin, UserOut, Token
from app.schemas.projects import (
    ProjectCreate, ProjectUpdate, ProjectOut, ResearchQuestionCreate, ResearchQuestionOut
)
from app.schemas.documents import DocumentOut, DocumentChunkOut, DocumentUploadResponse
from app.schemas.sources import SourceBase, SourceCreate, SourceOut, SearchRequest
from app.schemas.research import (
    ResearchRequest, ResearchTaskStatus, ResearchResult, EvidenceItemOut, ClaimOut, ContradictionOut
)
from app.schemas.common import HealthResponse, MessageResponse

__all__ = [
    "UserRegister", "UserLogin", "UserOut", "Token",
    "ProjectCreate", "ProjectUpdate", "ProjectOut", "ResearchQuestionCreate", "ResearchQuestionOut",
    "DocumentOut", "DocumentChunkOut", "DocumentUploadResponse",
    "SourceBase", "SourceCreate", "SourceOut", "SearchRequest",
    "ResearchRequest", "ResearchTaskStatus", "ResearchResult", "EvidenceItemOut", "ClaimOut", "ContradictionOut",
    "HealthResponse", "MessageResponse"
]
