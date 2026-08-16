from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
import datetime

class ResearchQuestionCreate(BaseModel):
    question_text: str = Field(..., min_length=5)
    objectives: List[str] = Field(default_factory=list)

class ResearchQuestionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    question_text: str
    objectives: List[str] = []
    status: str
    created_at: datetime.datetime

class ProjectCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=150)
    description: Optional[str] = None
    questions: Optional[List[ResearchQuestionCreate]] = None

class ProjectUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=2, max_length=150)
    description: Optional[str] = None

class ProjectOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    title: str
    description: Optional[str] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime
    questions: List[ResearchQuestionOut] = []
