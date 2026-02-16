"""Moderation business logic."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.moderation.models import Report, Block


async def create_report(
    db: AsyncSession, reporter_id: str, target_user_id: str | None,
    target_request_id: str | None, reason: str
) -> Report:
    """Create a new report."""
    report = Report(
        reporter_id=reporter_id,
        target_user_id=target_user_id,
        target_request_id=target_request_id,
        reason=reason,
    )
    db.add(report)
    await db.flush()
    return report


async def block_user(db: AsyncSession, blocker_id: str, blocked_id: str) -> Block:
    """Block a user."""
    block = Block(blocker_id=blocker_id, blocked_id=blocked_id)
    db.add(block)
    await db.flush()
    return block
