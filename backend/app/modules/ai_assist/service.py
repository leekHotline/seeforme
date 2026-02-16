"""AI Assist business logic (pluggable transcription backend)."""


async def transcribe_voice(voice_file_id: str) -> dict:
    """Transcribe a voice file to text.

    This is a placeholder implementation. In production, this would call
    a real speech-to-text service (e.g., Whisper, Tencent ASR, etc.).
    """
    # TODO: integrate real STT service
    return {
        "text": f"[Transcription placeholder for file: {voice_file_id}]",
        "confidence": 0.0,
    }
