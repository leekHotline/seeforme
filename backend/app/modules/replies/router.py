"""Reply API routes."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.security import get_current_user, require_role
from app.modules.auth.models import User
from app.modules.replies import schemas, service

router = APIRouter(prefix="/help-requests", tags=["replies"])


@router.post(
    "/{request_id}/replies",
    response_model=schemas.ReplyResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_reply(
    request_id: str,
    payload: schemas.ReplyCreateRequest,
    current_user: User = Depends(require_role("volunteer")),
    db: AsyncSession = Depends(get_db),
) -> schemas.ReplyResponse:
    """Create a reply to a help request. Volunteer must be assigned."""
    try:
        reply = await service.create_reply(db, request_id, current_user.id, payload)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return schemas.ReplyResponse.model_validate(reply)


@router.get("/{request_id}/replies", response_model=schemas.ReplyListResponse)
async def list_replies(
    request_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> schemas.ReplyListResponse:
    """List all replies for a help request."""
    replies = await service.list_replies(db, request_id)
    return schemas.ReplyListResponse(
        items=[schemas.ReplyResponse.model_validate(r) for r in replies]
    )
