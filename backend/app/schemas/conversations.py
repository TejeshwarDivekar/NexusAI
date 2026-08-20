from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional, Any, Dict
import datetime

class MessageCreate(BaseModel):
    role: str = Field(..., description="Role: 'user', 'assistant', or 'system'")
    content: str = Field(..., min_length=1)

class MessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    conversation_id: str
    role: str
    content: str
    created_at: datetime.datetime

class ConversationCreate(BaseModel):
    title: Optional[str] = None
    initial_query: Optional[str] = None

class ConversationUpdate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)

class ConversationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: int
    title: str
    created_at: datetime.datetime
    updated_at: datetime.datetime
    message_count: Optional[int] = 0
    task_count: Optional[int] = 0
    last_message: Optional[str] = None
    date_group: Optional[str] = None  # "Today", "Yesterday", "Older"

class ConversationDetailOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: int
    title: str
    created_at: datetime.datetime
    updated_at: datetime.datetime
    messages: List[MessageOut] = []
    tasks: List[Any] = []
