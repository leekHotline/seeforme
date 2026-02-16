"""Reply schemas."""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field


class ReplyCreateRequest(BaseModel):
    """Create a reply to a help request."""
    reply_type: str = Field(..., pattern="^(voice|text)$")
    voice_file_id: Optional[str] = None
    text: Optional[str] = None


class ReplyResponse(BaseModel):
    """Single reply detail."""
    id: str
    request_id: str
    volunteer_id: str
    reply_type: str
    voice_file_id: Optional[str] = None
    text: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ReplyListResponse(BaseModel):
    """List of replies."""
    items: list[ReplyResponse]
