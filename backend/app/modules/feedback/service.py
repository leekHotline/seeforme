"""Feedback business logic."""

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.feedback.models import Feedback
from app.modules.feedback.schemas import FeedbackCreateRequest
from app.modules.help_requests.models import HelpRequest


async def create_feedback(
    db: AsyncSession, request_id: str, seeker_id: str, payload: FeedbackCreateRequest
) -> tuple[Feedback, HelpRequest]:
    """Submit feedback for a help request."""
    # Check request exists and belongs to seeker
    result = await db.execute(select(HelpRequest).where(HelpRequest.id == request_id))
    req = result.scalar_one_or_none()
    if not req:
        raise ValueError("Request not found")
    if req.seeker_id != seeker_id:
        raise ValueError("Not your request")
    if req.status not in ("replied", "claimed"):
        raise ValueError(f"Cannot give feedback on request with status: {req.status}")

    # Check no existing feedback
    existing = await db.execute(
        select(Feedback).where(Feedback.request_id == request_id)
    )
    if existing.scalar_one_or_none():
        raise ValueError("Feedback already submitted")

    feedback = Feedback(
        request_id=request_id,
        seeker_id=seeker_id,
        resolved=payload.resolved,
        comment=payload.comment,
    )
    db.add(feedback)

    # Update request status
    req.status = "resolved" if payload.resolved else "unresolved"
    req.updated_at = datetime.now(timezone.utc)
    await db.flush()

    return feedback, req
