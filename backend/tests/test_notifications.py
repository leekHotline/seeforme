"""Tests for notification feed APIs."""

import pytest
from httpx import AsyncClient


async def _register_and_get_token(client: AsyncClient, email: str, role: str) -> str:
    """Register a user and return access token."""
    resp = await client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": "password123",
            "role": role,
        },
    )
    assert resp.status_code == 201
    return resp.json()["access_token"]


def _auth(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_seeker_notifications_include_reply(client: AsyncClient) -> None:
    """Seeker should see volunteer replies in notification feed."""
    seeker_token = await _register_and_get_token(
        client, "notice_seeker@test.com", "seeker"
    )
    volunteer_token = await _register_and_get_token(
        client, "notice_vol@test.com", "volunteer"
    )

    create_resp = await client.post(
        "/api/v1/help-requests",
        json={
            "text": "需要帮助确认说明文字",
            "mode": "hall",
        },
        headers=_auth(seeker_token),
    )
    assert create_resp.status_code == 201
    request_id = create_resp.json()["id"]

    claim_resp = await client.post(
        f"/api/v1/help-requests/{request_id}/claim",
        headers=_auth(volunteer_token),
    )
    assert claim_resp.status_code == 200

    reply_resp = await client.post(
        f"/api/v1/help-requests/{request_id}/replies",
        json={"reply_type": "text", "text": "这是布洛芬，按说明服用。"},
        headers=_auth(volunteer_token),
    )
    assert reply_resp.status_code == 201
    reply_id = reply_resp.json()["id"]

    notification_resp = await client.get(
        "/api/v1/notifications?limit=50", headers=_auth(seeker_token)
    )
    assert notification_resp.status_code == 200
    items = notification_resp.json()["items"]

    target = next((item for item in items if item["reply_id"] == reply_id), None)
    assert target is not None
    assert target["type"] == "reply"
    assert target["request_id"] == request_id
    assert target["title"] == "你的求助收到新回复"
    assert "布洛芬" in target["preview"]


@pytest.mark.asyncio
async def test_volunteer_notification_feed_is_empty(client: AsyncClient) -> None:
    """Volunteer feed is currently empty by design."""
    volunteer_token = await _register_and_get_token(
        client, "notice_vol_empty@test.com", "volunteer"
    )

    notification_resp = await client.get(
        "/api/v1/notifications", headers=_auth(volunteer_token)
    )
    assert notification_resp.status_code == 200
    assert notification_resp.json()["items"] == []
