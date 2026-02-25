"""Tests for upload validation (mock file storage)."""

import re
from pathlib import Path

import pytest
from httpx import AsyncClient

from app.core.config import settings
from app.core.security import decode_token


async def _register_and_get_token(client: AsyncClient, email: str, role: str) -> str:
    resp = await client.post("/api/v1/auth/register", json={
        "email": email,
        "password": "password123",
        "role": role,
    })
    return resp.json()["access_token"]


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def _find_uploaded_file(file_id: str) -> Path:
    upload_root = Path(settings.UPLOAD_DIR)
    matches = list(upload_root.rglob(f"{file_id}-*"))
    assert matches, f"Upload content file for {file_id} was not persisted"
    return matches[0]


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
    assert data["upload_url"].endswith("/content")


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


@pytest.mark.asyncio
async def test_upload_and_read_content(client: AsyncClient):
    """Upload file bytes after presign, then fetch file content."""
    token = await _register_and_get_token(client, "upload7@test.com", "seeker")

    presign_resp = await client.post(
        "/api/v1/uploads/presign",
        json={
            "filename": "photo.jpg",
            "mime_type": "image/jpeg",
            "size": 1024,
        },
        headers=_auth(token),
    )
    assert presign_resp.status_code == 200
    payload = presign_resp.json()
    file_id = payload["file_id"]

    content_bytes = b"fake-jpeg-content"
    upload_resp = await client.put(
        f"/api/v1/uploads/{file_id}/content",
        files={"content": ("photo.jpg", content_bytes, "image/jpeg")},
        headers=_auth(token),
    )
    assert upload_resp.status_code == 200
    uploaded_data = upload_resp.json()
    assert uploaded_data["file_id"] == file_id
    assert uploaded_data["size"] == len(content_bytes)
    assert uploaded_data["file_url"] == f"/uploads/{file_id}/content"

    read_resp = await client.get(
        f"/api/v1/uploads/{file_id}/content",
        headers=_auth(token),
    )
    assert read_resp.status_code == 200
    assert read_resp.content == content_bytes
    assert read_resp.headers["content-type"].startswith("image/jpeg")


@pytest.mark.asyncio
async def test_upload_content_rejects_non_owner(client: AsyncClient):
    """Only the creator of presign record can upload file content."""
    owner_token = await _register_and_get_token(client, "upload8@test.com", "seeker")
    other_token = await _register_and_get_token(client, "upload9@test.com", "seeker")

    presign_resp = await client.post(
        "/api/v1/uploads/presign",
        json={
            "filename": "voice.m4a",
            "mime_type": "audio/x-m4a",
            "size": 1024,
        },
        headers=_auth(owner_token),
    )
    file_id = presign_resp.json()["file_id"]

    upload_resp = await client.put(
        f"/api/v1/uploads/{file_id}/content",
        files={"content": ("voice.m4a", b"fake-audio", "audio/x-m4a")},
        headers=_auth(other_token),
    )
    assert upload_resp.status_code == 403


@pytest.mark.asyncio
async def test_upload_content_accepts_ios_mime_alias(client: AsyncClient):
    """iOS-style MIME aliases should be accepted when category matches."""
    token = await _register_and_get_token(client, "upload10@test.com", "seeker")

    presign_resp = await client.post(
        "/api/v1/uploads/presign",
        json={
            "filename": "voice.m4a",
            "mime_type": "audio/x-m4a",
            "size": 1024,
        },
        headers=_auth(token),
    )
    assert presign_resp.status_code == 200
    file_id = presign_resp.json()["file_id"]

    upload_resp = await client.put(
        f"/api/v1/uploads/{file_id}/content",
        files={"content": ("voice.m4a", b"fake-audio", "audio/m4a")},
        headers=_auth(token),
    )
    assert upload_resp.status_code == 200


@pytest.mark.asyncio
async def test_upload_webm_updates_mime_and_storage_path(client: AsyncClient):
    """WebM upload should persist with correct MIME and user/date storage path."""
    token = await _register_and_get_token(client, "upload11@test.com", "seeker")
    user_id = decode_token(token)["sub"]

    presign_resp = await client.post(
        "/api/v1/uploads/presign",
        json={
            "filename": "voice.m4a",
            "mime_type": "audio/x-m4a",
            "size": 4096,
        },
        headers=_auth(token),
    )
    assert presign_resp.status_code == 200
    file_id = presign_resp.json()["file_id"]

    webm_bytes = bytes.fromhex("1A45DFA39F4286810142F7810142F281") + b"test-webm"
    upload_resp = await client.put(
        f"/api/v1/uploads/{file_id}/content",
        files={"content": ("voice.m4a", webm_bytes, "audio/webm")},
        headers=_auth(token),
    )
    assert upload_resp.status_code == 200
    uploaded_data = upload_resp.json()
    assert uploaded_data["mime_type"] == "audio/webm"

    read_resp = await client.get(
        f"/api/v1/uploads/{file_id}/content",
        headers=_auth(token),
    )
    assert read_resp.status_code == 200
    assert read_resp.content == webm_bytes
    assert read_resp.headers["content-type"].startswith("audio/webm")

    stored_file = _find_uploaded_file(file_id)
    relative = stored_file.relative_to(Path(settings.UPLOAD_DIR))
    assert len(relative.parts) == 3
    assert relative.parts[0] == user_id
    assert re.fullmatch(r"\d{4}-\d{2}-\d{2}", relative.parts[1])
    assert stored_file.suffix.lower() == ".webm"
