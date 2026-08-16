from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
import datetime

class DocumentChunkOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    document_id: int
    chunk_index: int
    content: str
    page_number: int
    token_count: int

class DocumentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: Optional[int] = None
    filename: str
    file_type: str
    file_size: int
    status: str
    created_at: datetime.datetime
    chunks_count: Optional[int] = 0

class DocumentUploadResponse(BaseModel):
    id: int
    filename: str
    file_size: int
    char_count: int
    chunks_created: int
    message: str
