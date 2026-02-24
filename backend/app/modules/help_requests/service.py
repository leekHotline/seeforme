"""Help request business logic."""

from datetime import datetime, timezone

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.help_requests.models import HelpRequest, RequestAttachment
from app.modules.help_requests.schemas import HelpRequestCreateRequest

TEXT_ONLY_PLACEHOLDER_VOICE_FILE_ID = "text-only-placeholder"


def _dedupe_keep_order(values: list[str]) -> list[str]:
    seen: set[str] = set()
    deduped: list[str] = []
    for value in values:
        if value in seen:
            continue
        seen.add(value)
        deduped.append(value)
    return deduped


async def create_help_request(
    db: AsyncSession, seeker_id: str, payload: HelpRequestCreateRequest
) -> HelpRequest:
    """Create a new help request."""
    voice_file_ids = _dedupe_keep_order(
        [
            *(payload.voice_file_ids or []),
            *([payload.voice_file_id] if payload.voice_file_id else []),
        ]
    )
    primary_voice_file_id = (
        voice_file_ids[0] if voice_file_ids else TEXT_ONLY_PLACEHOLDER_VOICE_FILE_ID
    )

    req = HelpRequest(
        seeker_id=seeker_id,
        mode=payload.mode,
        target_volunteer_id=payload.target_volunteer_id,
        voice_file_id=primary_voice_file_id,
        raw_text=payload.text,
        priority=payload.priority,
        status="open",
    )
    db.add(req)
    await db.flush()

    # Attach media
    if payload.image_file_ids:
        for fid in payload.image_file_ids[:3]:
            att = RequestAttachment(request_id=req.id, file_id=fid, file_type="image")
            db.add(att)

    for fid in voice_file_ids[:3]:
        att = RequestAttachment(request_id=req.id, file_id=fid, file_type="voice")
        db.add(att)

    if payload.video_file_ids:
        for fid in payload.video_file_ids[:3]:
            att = RequestAttachment(request_id=req.id, file_id=fid, file_type="video")
            db.add(att)

    await db.flush()

    return req


async def get_hall_requests(
    db: AsyncSession, page: int = 1, page_size: int = 20, status_filter: str | None = None
) -> tuple[list[HelpRequest], int]:
    """Get paginated help requests for the public hall."""
    query = (
        select(HelpRequest)
        .options(selectinload(HelpRequest.attachments))
        .where(HelpRequest.mode == "hall")
    )
    count_query = select(func.count()).select_from(HelpRequest).where(HelpRequest.mode == "hall")

    if status_filter:
        query = query.where(HelpRequest.status == status_filter)
        count_query = count_query.where(HelpRequest.status == status_filter)

    query = query.order_by(HelpRequest.priority.desc(), HelpRequest.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)

    result = await db.execute(query)
    items = list(result.scalars().all())

    count_result = await db.execute(count_query)
    total = count_result.scalar() or 0

    return items, total


async def get_seeker_requests(
    db: AsyncSession,
    seeker_id: str,
    page: int = 1,
    page_size: int = 20,
    status_filter: str | None = None,
) -> tuple[list[HelpRequest], int]:
    """Get paginated help requests created by a specific seeker."""
    query = (
        select(HelpRequest)
        .options(selectinload(HelpRequest.attachments))
        .where(HelpRequest.seeker_id == seeker_id)
    )
    count_query = (
        select(func.count())
        .select_from(HelpRequest)
        .where(HelpRequest.seeker_id == seeker_id)
    )

    if status_filter:
        query = query.where(HelpRequest.status == status_filter)
        count_query = count_query.where(HelpRequest.status == status_filter)

    query = query.order_by(HelpRequest.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)

    result = await db.execute(query)
    items = list(result.scalars().all())

    count_result = await db.execute(count_query)
    total = count_result.scalar() or 0

    return items, total


async def get_request_by_id(db: AsyncSession, request_id: str) -> HelpRequest | None:
    """Get a single help request by ID."""
    result = await db.execute(
        select(HelpRequest)
        .options(selectinload(HelpRequest.attachments))
        .where(HelpRequest.id == request_id)
    )
    return result.scalar_one_or_none()


async def cancel_request(db: AsyncSession, request: HelpRequest) -> HelpRequest:
    """Cancel a help request. Only open/claimed/replied can be cancelled."""
    if request.status in ("resolved", "unresolved", "cancelled"):
        raise ValueError(f"Cannot cancel request with status: {request.status}")
    request.status = "cancelled"
    request.updated_at = datetime.now(timezone.utc)
    await db.flush()
    return request
