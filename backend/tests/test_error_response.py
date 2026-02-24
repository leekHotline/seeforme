"""Tests for unified error response payload."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_auth_error_uses_unified_error_payload(client: AsyncClient):
    """Invalid login should return code/message/data payload."""
    resp = await client.post(
        "/api/v1/auth/login",
        json={"account": "missing@test.com", "password": "wrong-password"},
    )

    assert resp.status_code == 401
    body = resp.json()
    assert body["code"] == 1002
    assert isinstance(body["message"], str)
    assert "data" in body


@pytest.mark.asyncio
async def test_validation_error_uses_unified_error_payload(client: AsyncClient):
    """Schema validation failures should return code 1001."""
    resp = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "valid@test.com",
            "password": "123456",
            "role": "not-a-valid-role",
        },
    )

    assert resp.status_code == 422
    body = resp.json()
    assert body["code"] == 1001
    assert body["message"] == "Request validation failed"
    assert isinstance(body["data"]["errors"], list)
