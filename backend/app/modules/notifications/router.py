"""Notification API routes."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.security import get_current_user
from app.modules.auth.models import User
from app.modules.notifications import schemas
from app.modules.notifications import service

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=schemas.NotificationListResponse)
async def get_notifications(
    limit: int = Query(100, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> schemas.NotificationListResponse:
    """Get in-app notifications for current user."""
    items = await service.list_notifications(db, current_user=current_user, limit=limit)
    return schemas.NotificationListResponse(items=items)
