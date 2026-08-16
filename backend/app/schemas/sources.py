from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
import datetime

class SourceBase(BaseModel):
    title: str
    url: str
    snippet: Optional[str] = None
    source_type: str = "web"
    authors: List[str] = []
    publication_date: Optional[str] = None
    reliability_score: float = 0.85
    metadata_json: Dict[str, Any] = {}

class SourceCreate(SourceBase):
    project_id: Optional[int] = None

class SourceOut(SourceBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: Optional[int] = None
    created_at: datetime.datetime

class SearchRequest(BaseModel):
    query: str = Field(..., min_length=2)
    include_academic: bool = True
    max_results: int = 10
    project_id: Optional[int] = None
