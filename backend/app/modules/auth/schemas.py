"""Auth request / response schemas."""

from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    """Registration payload."""
    phone: Optional[str] = None
    email: Optional[str] = None
    password: str = Field(..., min_length=6)
    role: str = Field(..., pattern="^(seeker|volunteer)$")


class LoginRequest(BaseModel):
    """Login payload (phone or email + password)."""
    account: str = Field(..., description="Phone number or email")
    password: str


class RefreshTokenRequest(BaseModel):
    """Token refresh payload."""
    refresh_token: str


class AuthTokenResponse(BaseModel):
    """Token pair response."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    role: str


class UserBasicResponse(BaseModel):
    """Minimal user info returned after registration."""
    id: str
    role: str
    phone: Optional[str] = None
    email: Optional[str] = None

    model_config = {"from_attributes": True}
