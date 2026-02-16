"""Feedback schemas."""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class FeedbackCreateRequest(BaseModel):
    """Submit feedback for a help request."""
    resolved: bool
    comment: Optional[str] = None


class FeedbackResponse(BaseModel):
    """Feedback detail."""
    id: str
    request_id: str
    seeker_id: str
    resolved: bool
    comment: Optional[str] = None
    created_at: datetime
    request_status: Optional[str] = None

    model_config = {"from_attributes": True}
