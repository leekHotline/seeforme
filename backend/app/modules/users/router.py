"""Users API routes."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.security import get_current_user
from app.modules.auth.models import User
from app.modules.users import schemas, service

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=schemas.UserProfileResponse)
async def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> schemas.UserProfileResponse:
    """Get current user profile with accessibility settings."""
    profile = await service.get_user_profile(db, current_user)
    return schemas.UserProfileResponse(**profile)


@router.patch("/me/accessibility", response_model=schemas.AccessibilityResponse)
async def update_my_accessibility(
    payload: schemas.AccessibilityUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> schemas.AccessibilityResponse:
    """Update current user accessibility settings."""
    updated = await service.update_accessibility(db, current_user.id, payload)
    return schemas.AccessibilityResponse(
        tts_enabled=updated.tts_enabled,
        tts_rate=float(updated.tts_rate),
        haptic_enabled=updated.haptic_enabled,
        voice_prompt_level=updated.voice_prompt_level,
    )
