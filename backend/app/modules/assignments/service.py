"""Assignment business logic."""

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.assignments.models import Assignment
from app.modules.help_requests.models import HelpRequest


async def claim_request(
    db: AsyncSession, request_id: str, volunteer_id: str
) -> Assignment:
    """Volunteer claims a help request."""
    # Check request exists and is open
    result = await db.execute(select(HelpRequest).where(HelpRequest.id == request_id))
    req = result.scalar_one_or_none()
    if not req:
        raise ValueError("Request not found")
    if req.status != "open":
        raise ValueError(f"Cannot claim request with status: {req.status}")

    # Check not already assigned
    existing = await db.execute(
        select(Assignment).where(Assignment.request_id == request_id)
    )
    if existing.scalar_one_or_none():
        raise ValueError("Request already claimed")

    assignment = Assignment(request_id=request_id, volunteer_id=volunteer_id)
    db.add(assignment)
    req.status = "claimed"
    req.updated_at = datetime.now(timezone.utc)
    await db.flush()

    return assignment


async def get_assignment_by_request(
    db: AsyncSession, request_id: str
) -> Assignment | None:
    """Get assignment for a request."""
    result = await db.execute(
        select(Assignment).where(Assignment.request_id == request_id)
    )
    return result.scalar_one_or_none()
