"""Feedback API routes."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.security import require_role
from app.modules.auth.models import User
from app.modules.feedback import schemas, service

router = APIRouter(prefix="/help-requests", tags=["feedback"])


@router.post(
    "/{request_id}/feedback",
    response_model=schemas.FeedbackResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_feedback(
    request_id: str,
    payload: schemas.FeedbackCreateRequest,
    current_user: User = Depends(require_role("seeker")),
    db: AsyncSession = Depends(get_db),
) -> schemas.FeedbackResponse:
    """Submit feedback for a help request. Seeker only."""
    try:
        feedback, req = await service.create_feedback(
            db, request_id, current_user.id, payload
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return schemas.FeedbackResponse(
        id=feedback.id,
        request_id=feedback.request_id,
        seeker_id=feedback.seeker_id,
        resolved=feedback.resolved,
        comment=feedback.comment,
        created_at=feedback.created_at,
        request_status=req.status,
    )
