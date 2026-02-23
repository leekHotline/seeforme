"""Uploads API routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.security import get_current_user
from app.modules.auth.models import User
from app.modules.uploads import schemas, service

router = APIRouter(prefix="/uploads", tags=["uploads"])


@router.post("/presign", response_model=schemas.PresignResponse)
async def presign_upload(
    payload: schemas.PresignRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> schemas.PresignResponse:
    """Get a presigned upload URL for image, voice, or video files."""
    try:
        result = await service.presign_upload(
            db, current_user.id, payload.filename, payload.mime_type, payload.size
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return schemas.PresignResponse(**result)
