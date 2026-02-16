"""Moderation API routes."""

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.security import get_current_user
from app.modules.auth.models import User
from app.modules.moderation import schemas, service

router = APIRouter(prefix="/moderation", tags=["moderation"])


@router.post("/report", response_model=schemas.ReportResponse, status_code=status.HTTP_201_CREATED)
async def submit_report(
    payload: schemas.ReportRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> schemas.ReportResponse:
    """Submit a report against a user or request."""
    report = await service.create_report(
        db, current_user.id, payload.target_user_id, payload.target_request_id, payload.reason
    )
    return schemas.ReportResponse(id=report.id)


@router.post("/block", response_model=schemas.BlockResponse, status_code=status.HTTP_201_CREATED)
async def block_user(
    payload: schemas.BlockRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> schemas.BlockResponse:
    """Block a user."""
    block = await service.block_user(db, current_user.id, payload.target_user_id)
    return schemas.BlockResponse(id=block.id)
