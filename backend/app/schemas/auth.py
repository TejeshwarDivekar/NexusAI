from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional
import datetime

class UserRegister(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=2, max_length=50)
    password: str = Field(..., min_length=6, max_length=100)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    username: str
    is_active: bool
    created_at: datetime.datetime

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
