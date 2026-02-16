"""Auth / User ORM models."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Numeric, SmallInteger, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    role: Mapped[str] = mapped_column(String(20), nullable=False)  # seeker | volunteer
    phone: Mapped[str | None] = mapped_column(String(20), unique=True, nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    settings: Mapped["UserSettings"] = relationship(back_populates="user", uselist=False)


class UserSettings(Base):
    __tablename__ = "user_settings"

    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id"), primary_key=True
    )
    tts_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    tts_rate: Mapped[float] = mapped_column(Numeric(3, 1), default=1.0)
    haptic_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    voice_prompt_level: Mapped[int] = mapped_column(SmallInteger, default=2)

    user: Mapped["User"] = relationship(back_populates="settings")
