"""Tests for image analysis: describe endpoint."""

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
async def test_describe_image(client: AsyncClient):
    """Test image description endpoint for visually impaired users."""
    token = await _register_and_get_token(client, "img1@test.com", "seeker")

    resp = await client.post("/api/v1/image-analysis/describe", json={
        "image_file_id": "test-image-456",
        "language": "zh-CN",
    }, headers=_auth(token))

    assert resp.status_code == 200
    data = resp.json()
    assert "description" in data
    assert "is_clear" in data
    assert data["confidence"] is not None


@pytest.mark.asyncio
async def test_describe_image_default_language(client: AsyncClient):
    """Test image description with default language."""
    token = await _register_and_get_token(client, "img2@test.com", "seeker")

    resp = await client.post("/api/v1/image-analysis/describe", json={
        "image_file_id": "test-image-789",
    }, headers=_auth(token))

    assert resp.status_code == 200
    data = resp.json()
    assert "description" in data


@pytest.mark.asyncio
async def test_describe_image_requires_auth(client: AsyncClient):
    """Test that image description requires authentication."""
    resp = await client.post("/api/v1/image-analysis/describe", json={
        "image_file_id": "test-image-000",
    })
    assert resp.status_code == 403 or resp.status_code == 401
