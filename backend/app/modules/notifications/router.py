"""Notification API routes (placeholder)."""

from fastapi import APIRouter, Depends

from app.core.security import get_current_user
from app.modules.auth.models import User
from app.modules.notifications import schemas

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=schemas.NotificationResponse)
async def get_notifications(
    current_user: User = Depends(get_current_user),
) -> schemas.NotificationResponse:
    """Get user notifications (placeholder)."""
    return schemas.NotificationResponse()
