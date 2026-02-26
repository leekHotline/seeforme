"""Notification service."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.auth.models import User
from app.modules.help_requests.models import HelpRequest
from app.modules.notifications.schemas import NotificationItem
from app.modules.replies.models import Reply


def _build_reply_preview(reply: Reply) -> str:
    if reply.reply_type == "voice":
        return "收到一条语音回复，点击进入详情收听。"
    if reply.text and reply.text.strip():
        return reply.text.strip()
    return "收到一条文本回复，点击查看详情。"


async def list_notifications(
    db: AsyncSession,
    current_user: User,
    limit: int = 100,
) -> list[NotificationItem]:
    """List in-app notifications for current user.

    Current behavior:
    - seeker: return reply notifications from their own help requests.
    - volunteer: return empty list (no volunteer message center feed yet).
    """
    if current_user.role != "seeker":
        return []

    result = await db.execute(
        select(Reply)
        .join(HelpRequest, HelpRequest.id == Reply.request_id)
        .where(HelpRequest.seeker_id == current_user.id)
        .order_by(Reply.created_at.desc())
        .limit(limit)
    )

    items: list[NotificationItem] = []
    for reply in result.scalars().all():
        items.append(
            NotificationItem(
                id=f"reply-{reply.id}",
                type="reply",
                sender="志愿者",
                title="你的求助收到新回复",
                preview=_build_reply_preview(reply),
                tag="语音" if reply.reply_type == "voice" else "回复",
                request_id=reply.request_id,
                reply_id=reply.id,
                created_at=reply.created_at,
            )
        )

    return items
