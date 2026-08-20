from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional
import datetime

class UserRegister(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=2, max_length=50)
    password: str = Field(..., min_length=6, max_length=100)

class UserLogin(BaseModel):
    username_or_email: Optional[str] = None
    email: Optional[EmailStr] = None
    password: str

class OAuthSyncRequest(BaseModel):
    provider: str = "google"
    provider_user_id: str = Field(..., description="Stable provider user ID from Google / OAuth sub")
    email: EmailStr
    name: Optional[str] = None
    username: Optional[str] = None
    profile_image: Optional[str] = None

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    provider_user_id: Optional[str] = None
    name: Optional[str] = None
    email: str
    username: str
    profile_image: Optional[str] = None
    is_active: bool
    created_at: datetime.datetime

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
