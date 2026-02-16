"""Assignment API routes (claim endpoint lives under help-requests)."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.security import require_role
from app.modules.auth.models import User
from app.modules.assignments import schemas, service

router = APIRouter(prefix="/help-requests", tags=["assignments"])


@router.post("/{request_id}/claim", response_model=schemas.ClaimResponse)
async def claim_request(
    request_id: str,
    current_user: User = Depends(require_role("volunteer")),
    db: AsyncSession = Depends(get_db),
) -> schemas.ClaimResponse:
    """Claim a help request. Only volunteers can claim open requests."""
    try:
        assignment = await service.claim_request(db, request_id, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return schemas.ClaimResponse.model_validate(assignment)
