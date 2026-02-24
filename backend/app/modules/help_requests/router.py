"""Help requests API routes."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.security import get_current_user, require_role
from app.modules.auth.models import User
from app.modules.help_requests import schemas, service

router = APIRouter(prefix="/help-requests", tags=["help-requests"])


@router.post(
    "",
    response_model=schemas.HelpRequestResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_help_request(
    payload: schemas.HelpRequestCreateRequest,
    current_user: User = Depends(require_role("seeker")),
    db: AsyncSession = Depends(get_db),
) -> schemas.HelpRequestResponse:
    """Create a new help request. Requires seeker role."""
    req = await service.create_help_request(db, current_user.id, payload)
    await db.refresh(req, attribute_names=["attachments"])
    return schemas.HelpRequestResponse.model_validate(req)


@router.get("/hall", response_model=schemas.HelpRequestListResponse)
async def list_hall_requests(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status_filter: str | None = Query(None, alias="status"),
    current_user: User = Depends(require_role("volunteer")),
    db: AsyncSession = Depends(get_db),
) -> schemas.HelpRequestListResponse:
    """List help requests in the public hall. Requires volunteer role."""
    items, total = await service.get_hall_requests(db, page, page_size, status_filter)
    return schemas.HelpRequestListResponse(
        items=[schemas.HelpRequestResponse.model_validate(r) for r in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/mine", response_model=schemas.HelpRequestListResponse)
async def list_my_requests(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status_filter: str | None = Query(None, alias="status"),
    current_user: User = Depends(require_role("seeker")),
    db: AsyncSession = Depends(get_db),
) -> schemas.HelpRequestListResponse:
    """List current seeker's own help requests."""
    items, total = await service.get_seeker_requests(
        db,
        seeker_id=current_user.id,
        page=page,
        page_size=page_size,
        status_filter=status_filter,
    )
    return schemas.HelpRequestListResponse(
        items=[schemas.HelpRequestResponse.model_validate(r) for r in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/{request_id}", response_model=schemas.HelpRequestResponse)
async def get_help_request(
    request_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> schemas.HelpRequestResponse:
    """Get help request details. Seeker sees own, volunteer sees all."""
    req = await service.get_request_by_id(db, request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    # Permission check
    if current_user.role == "seeker" and req.seeker_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your request")

    return schemas.HelpRequestResponse.model_validate(req)


@router.post("/{request_id}/cancel", response_model=schemas.HelpRequestResponse)
async def cancel_help_request(
    request_id: str,
    current_user: User = Depends(require_role("seeker")),
    db: AsyncSession = Depends(get_db),
) -> schemas.HelpRequestResponse:
    """Cancel a help request. Only the seeker who created it can cancel."""
    req = await service.get_request_by_id(db, request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.seeker_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your request")

    try:
        updated = await service.cancel_request(db, req)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return schemas.HelpRequestResponse.model_validate(updated)
