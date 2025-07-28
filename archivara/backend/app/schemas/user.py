from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    """Base user schema."""
    email: EmailStr
    full_name: str
    affiliation: Optional[str] = None


class UserCreate(UserBase):
    """Schema for creating user."""
    password: str


class UserUpdate(UserBase):
    """Schema for updating user."""
    password: Optional[str] = None


class UserResponse(UserBase):
    """Schema for user response."""
    id: str
    created_at: datetime
    is_active: bool
    is_verified: bool

    model_config = {"from_attributes": True}


class Token(BaseModel):
    """Token response schema."""
    access_token: str
    token_type: str
    user: dict


class TokenData(BaseModel):
    """Token data schema."""
    email: Optional[str] = None 