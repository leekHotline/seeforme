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


class SynthesizeRequest(BaseModel):
    """Request text-to-speech synthesis."""
    text: str
    language: str = "zh-CN"
    speed: float = 1.0


class SynthesizeResponse(BaseModel):
    """Text-to-speech synthesis result."""
    audio_url: str
    duration_seconds: Optional[float] = None
