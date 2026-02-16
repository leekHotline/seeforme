"""Users business logic."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.models import User, UserSettings
from app.modules.users.schemas import AccessibilityUpdateRequest


async def get_user_profile(db: AsyncSession, user: User) -> dict:
    """Build the full user profile dict including accessibility settings."""
    result = await db.execute(
        select(UserSettings).where(UserSettings.user_id == user.id)
    )
    settings = result.scalar_one_or_none()

    return {
        "id": user.id,
        "role": user.role,
        "phone": user.phone,
        "email": user.email,
        "is_active": user.is_active,
        "tts_enabled": settings.tts_enabled if settings else True,
        "tts_rate": float(settings.tts_rate) if settings else 1.0,
        "haptic_enabled": settings.haptic_enabled if settings else True,
        "voice_prompt_level": settings.voice_prompt_level if settings else 2,
    }


async def update_accessibility(
    db: AsyncSession, user_id: str, payload: AccessibilityUpdateRequest
) -> UserSettings:
    """Update user accessibility settings."""
    result = await db.execute(
        select(UserSettings).where(UserSettings.user_id == user_id)
    )
    settings = result.scalar_one_or_none()

    if not settings:
        settings = UserSettings(user_id=user_id)
        db.add(settings)

    if payload.tts_enabled is not None:
        settings.tts_enabled = payload.tts_enabled
    if payload.tts_rate is not None:
        settings.tts_rate = payload.tts_rate
    if payload.haptic_enabled is not None:
        settings.haptic_enabled = payload.haptic_enabled
    if payload.voice_prompt_level is not None:
        settings.voice_prompt_level = payload.voice_prompt_level

    await db.flush()
    return settings
