"""Help request schemas."""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field


class HelpRequestCreateRequest(BaseModel):
    """Create a new help request."""
    voice_file_id: str
    text: Optional[str] = None
    image_file_ids: Optional[list[str]] = Field(default=None, max_length=3)
    mode: str = Field(default="hall", pattern="^(hall|direct)$")
    target_volunteer_id: Optional[str] = None


class HelpRequestResponse(BaseModel):
    """Single help request detail."""
    id: str
    seeker_id: str
    mode: str
    target_volunteer_id: Optional[str] = None
    status: str
    voice_file_id: str
    raw_text: Optional[str] = None
    transcribed_text: Optional[str] = None
    category: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class HelpRequestListResponse(BaseModel):
    """Paginated list of help requests."""
    items: list[HelpRequestResponse]
    total: int
    page: int
    page_size: int
