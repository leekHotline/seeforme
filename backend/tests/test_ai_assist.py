"""Tests for AI assist: transcribe and synthesize endpoints."""

import pytest
from httpx import AsyncClient


async def _register_and_get_token(client: AsyncClient, email: str, role: str) -> str:
    resp = await client.post("/api/v1/auth/register", json={
        "email": email,
        "password": "password123",
        "role": role,
    })
    return resp.json()["access_token"]


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_transcribe_voice(client: AsyncClient):
    """Test voice-to-text transcription endpoint."""
    token = await _register_and_get_token(client, "ai1@test.com", "seeker")

    resp = await client.post("/api/v1/ai-assist/transcribe", json={
        "voice_file_id": "test-file-123",
    }, headers=_auth(token))

    assert resp.status_code == 200
    data = resp.json()
    assert "text" in data
    assert data["confidence"] is not None


@pytest.mark.asyncio
async def test_synthesize_speech(client: AsyncClient):
    """Test text-to-speech synthesis endpoint."""
    token = await _register_and_get_token(client, "ai2@test.com", "seeker")

    resp = await client.post("/api/v1/ai-assist/synthesize", json={
        "text": "你好，世界",
        "language": "zh-CN",
        "speed": 1.0,
    }, headers=_auth(token))

    assert resp.status_code == 200
    data = resp.json()
    assert "audio_url" in data
    assert data["duration_seconds"] is not None
    assert data["duration_seconds"] > 0


@pytest.mark.asyncio
async def test_synthesize_requires_auth(client: AsyncClient):
    """Test that synthesize requires authentication."""
    resp = await client.post("/api/v1/ai-assist/synthesize", json={
        "text": "hello",
    })
    assert resp.status_code == 403 or resp.status_code == 401
