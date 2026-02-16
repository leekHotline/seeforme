"""Replies ORM model."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Reply(Base):
    __tablename__ = "replies"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    request_id: Mapped[str] = mapped_column(String(36), ForeignKey("help_requests.id"), nullable=False)
    volunteer_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    reply_type: Mapped[str] = mapped_column(String(10), nullable=False)  # voice | text
    voice_file_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    text: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
