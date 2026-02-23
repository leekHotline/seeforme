"""AI Assist API routes."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.security import get_current_user
from app.modules.auth.models import User
from app.modules.ai_assist import schemas, service

router = APIRouter(prefix="/ai-assist", tags=["ai-assist"])


@router.post("/transcribe", response_model=schemas.TranscribeResponse)
async def transcribe_voice(
    payload: schemas.TranscribeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> schemas.TranscribeResponse:
    """Transcribe a voice file to text using AI."""
    result = await service.transcribe_voice(payload.voice_file_id)
    return schemas.TranscribeResponse(**result)


@router.post("/synthesize", response_model=schemas.SynthesizeResponse)
async def synthesize_speech(
    payload: schemas.SynthesizeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> schemas.SynthesizeResponse:
    """Convert text to speech audio using AI."""
    result = await service.synthesize_speech(
        payload.text, payload.language, payload.speed
    )
    return schemas.SynthesizeResponse(**result)
