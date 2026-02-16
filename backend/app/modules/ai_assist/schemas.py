"""AI Assist schemas."""

from typing import Optional
from pydantic import BaseModel


class TranscribeRequest(BaseModel):
    """Request voice-to-text transcription."""
    voice_file_id: str


class TranscribeResponse(BaseModel):
    """Transcription result."""
    text: str
    confidence: Optional[float] = None
