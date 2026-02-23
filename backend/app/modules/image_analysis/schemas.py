"""Image analysis schemas."""

from typing import Optional
from pydantic import BaseModel


class ImageDescribeRequest(BaseModel):
    """Request an AI description of an image."""
    image_file_id: str
    language: str = "zh-CN"


class ImageDescribeResponse(BaseModel):
    """AI-generated image description."""
    description: str
    is_clear: bool
    clarity_note: Optional[str] = None
    confidence: Optional[float] = None
