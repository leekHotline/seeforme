"""User profile and settings schemas."""

from typing import Optional
from pydantic import BaseModel


class UserProfileResponse(BaseModel):
    """Full user profile."""
    id: str
    role: str
    phone: Optional[str] = None
    email: Optional[str] = None
    is_active: bool
    tts_enabled: bool = True
    tts_rate: float = 1.0
    haptic_enabled: bool = True
    voice_prompt_level: int = 2

    model_config = {"from_attributes": True}


class AccessibilityUpdateRequest(BaseModel):
    """Update accessibility settings."""
    tts_enabled: Optional[bool] = None
    tts_rate: Optional[float] = None
    haptic_enabled: Optional[bool] = None
    voice_prompt_level: Optional[int] = None


class AccessibilityResponse(BaseModel):
    """Accessibility settings response."""
    tts_enabled: bool
    tts_rate: float
    haptic_enabled: bool
    voice_prompt_level: int

    model_config = {"from_attributes": True}
