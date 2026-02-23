"""Image analysis API routes."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.security import get_current_user
from app.modules.auth.models import User
from app.modules.image_analysis import schemas, service

router = APIRouter(prefix="/image-analysis", tags=["image-analysis"])


@router.post("/describe", response_model=schemas.ImageDescribeResponse)
async def describe_image(
    payload: schemas.ImageDescribeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> schemas.ImageDescribeResponse:
    """Describe an image to help visually impaired users understand its content."""
    result = await service.describe_image(payload.image_file_id, payload.language)
    return schemas.ImageDescribeResponse(**result)
