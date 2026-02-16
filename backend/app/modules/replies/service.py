"""Reply business logic."""

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.assignments.models import Assignment
from app.modules.help_requests.models import HelpRequest
from app.modules.replies.models import Reply
from app.modules.replies.schemas import ReplyCreateRequest


async def create_reply(
    db: AsyncSession, request_id: str, volunteer_id: str, payload: ReplyCreateRequest
) -> Reply:
    """Create a reply for a help request."""
    # Check request exists
    result = await db.execute(select(HelpRequest).where(HelpRequest.id == request_id))
    req = result.scalar_one_or_none()
    if not req:
        raise ValueError("Request not found")

    # Check volunteer is assigned
    assign_result = await db.execute(
        select(Assignment).where(
            Assignment.request_id == request_id,
            Assignment.volunteer_id == volunteer_id,
        )
    )
    if not assign_result.scalar_one_or_none():
        raise ValueError("You are not assigned to this request")

    # Validate reply content
    if payload.reply_type == "voice" and not payload.voice_file_id:
        raise ValueError("voice_file_id required for voice reply")
    if payload.reply_type == "text" and not payload.text:
        raise ValueError("text required for text reply")

    reply = Reply(
        request_id=request_id,
        volunteer_id=volunteer_id,
        reply_type=payload.reply_type,
        voice_file_id=payload.voice_file_id,
        text=payload.text,
    )
    db.add(reply)

    # Update request status
    if req.status == "claimed":
        req.status = "replied"
        req.updated_at = datetime.now(timezone.utc)

    await db.flush()
    return reply


async def list_replies(db: AsyncSession, request_id: str) -> list[Reply]:
    """List all replies for a request, ordered by time."""
    result = await db.execute(
        select(Reply)
        .where(Reply.request_id == request_id)
        .order_by(Reply.created_at.asc())
    )
    return list(result.scalars().all())
