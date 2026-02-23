"""Help requests ORM models."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, SmallInteger, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class HelpRequest(Base):
    __tablename__ = "help_requests"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    seeker_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    mode: Mapped[str] = mapped_column(String(10), nullable=False, default="hall")  # hall | direct
    target_volunteer_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="open")
    voice_file_id: Mapped[str] = mapped_column(String(36), nullable=False)
    raw_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    transcribed_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str | None] = mapped_column(String(50), nullable=True)
    priority: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=0)  # 0=normal, 1=urgent, 2=critical
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, onupdate=_utcnow)

    attachments: Mapped[list["RequestAttachment"]] = relationship(back_populates="request")


class RequestAttachment(Base):
    __tablename__ = "request_attachments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    request_id: Mapped[str] = mapped_column(String(36), ForeignKey("help_requests.id"), nullable=False)
    file_id: Mapped[str] = mapped_column(String(36), nullable=False)
    file_type: Mapped[str] = mapped_column(String(20), nullable=False)

    request: Mapped["HelpRequest"] = relationship(back_populates="attachments")
