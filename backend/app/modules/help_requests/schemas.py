"""Help request schemas."""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, model_validator


class HelpRequestCreateRequest(BaseModel):
    """Create a new help request."""
    voice_file_id: Optional[str] = None
    voice_file_ids: Optional[list[str]] = Field(default=None, max_length=3)
    text: Optional[str] = None
    image_file_ids: Optional[list[str]] = Field(default=None, max_length=3)
    video_file_ids: Optional[list[str]] = Field(default=None, max_length=3)
    mode: str = Field(default="hall", pattern="^(hall|direct)$")
    target_volunteer_id: Optional[str] = None
    priority: int = Field(default=0, ge=0, le=2)

    @model_validator(mode="after")
    def validate_content(self) -> "HelpRequestCreateRequest":
        has_text = bool(self.text and self.text.strip())
        has_media = bool(
            self.voice_file_id
            or self.voice_file_ids
            or self.image_file_ids
            or self.video_file_ids
        )
        if not has_text and not has_media:
            raise ValueError("At least one of text/image/voice/video is required")
        return self


class RequestAttachmentResponse(BaseModel):
    """Attachment metadata of a request."""

    id: str
    file_id: str
    file_type: str
    file_url: str

    model_config = {"from_attributes": True}


class HelpRequestResponse(BaseModel):
    """Single help request detail."""
    id: str
    seeker_id: str
    mode: str
    target_volunteer_id: Optional[str] = None
    status: str
    voice_file_id: Optional[str] = None
    raw_text: Optional[str] = None
    transcribed_text: Optional[str] = None
    category: Optional[str] = None
    priority: int = 0
    attachments: list[RequestAttachmentResponse] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class HelpRequestListResponse(BaseModel):
    """Paginated list of help requests."""
    items: list[HelpRequestResponse]
    total: int
    page: int
    page_size: int
