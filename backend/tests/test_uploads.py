"""Tests for upload validation (mock file storage)."""

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
async def test_presign_valid_image(client: AsyncClient):
    """Test presigning a valid image upload."""
    token = await _register_and_get_token(client, "upload1@test.com", "seeker")

    resp = await client.post("/api/v1/uploads/presign", json={
        "filename": "photo.jpg",
        "mime_type": "image/jpeg",
        "size": 1024 * 1024,  # 1MB
    }, headers=_auth(token))

    assert resp.status_code == 200
    data = resp.json()
    assert data["file_id"]
    assert data["upload_url"]


@pytest.mark.asyncio
async def test_presign_invalid_type(client: AsyncClient):
    """Test rejecting unsupported file type."""
    token = await _register_and_get_token(client, "upload2@test.com", "seeker")

    resp = await client.post("/api/v1/uploads/presign", json={
        "filename": "malware.exe",
        "mime_type": "application/octet-stream",
        "size": 1024,
    }, headers=_auth(token))

    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_presign_image_too_large(client: AsyncClient):
    """Test rejecting oversized image."""
    token = await _register_and_get_token(client, "upload3@test.com", "seeker")

    resp = await client.post("/api/v1/uploads/presign", json={
        "filename": "huge.jpg",
        "mime_type": "image/jpeg",
        "size": 10 * 1024 * 1024,  # 10MB > 5MB limit
    }, headers=_auth(token))

    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_presign_valid_voice(client: AsyncClient):
    """Test presigning a valid voice upload."""
    token = await _register_and_get_token(client, "upload4@test.com", "seeker")

    resp = await client.post("/api/v1/uploads/presign", json={
        "filename": "recording.m4a",
        "mime_type": "audio/mp4",
        "size": 2 * 1024 * 1024,  # 2MB
    }, headers=_auth(token))

    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_presign_valid_video(client: AsyncClient):
    """Test presigning a valid video upload."""
    token = await _register_and_get_token(client, "upload5@test.com", "seeker")

    resp = await client.post("/api/v1/uploads/presign", json={
        "filename": "clip.mp4",
        "mime_type": "video/mp4",
        "size": 10 * 1024 * 1024,  # 10MB
    }, headers=_auth(token))

    assert resp.status_code == 200
    data = resp.json()
    assert data["file_id"]
    assert data["category"] == "video"


@pytest.mark.asyncio
async def test_presign_video_too_large(client: AsyncClient):
    """Test rejecting oversized video."""
    token = await _register_and_get_token(client, "upload6@test.com", "seeker")

    resp = await client.post("/api/v1/uploads/presign", json={
        "filename": "huge.mp4",
        "mime_type": "video/mp4",
        "size": 60 * 1024 * 1024,  # 60MB > 50MB limit
    }, headers=_auth(token))

    assert resp.status_code == 400
