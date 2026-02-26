"""Notification schemas."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class NotificationItem(BaseModel):
    """Single in-app notification item."""

    id: str
    type: Literal["reply", "system"] = "reply"
    sender: str
    title: str
    preview: str
    tag: str
    request_id: str | None = None
    reply_id: str | None = None
    created_at: datetime


class NotificationListResponse(BaseModel):
    """List of in-app notifications."""

    items: list[NotificationItem]
