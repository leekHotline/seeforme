"""Tests for the core help request flow: create, claim, reply, feedback."""

import pytest
from httpx import AsyncClient


async def _register_and_get_token(client: AsyncClient, email: str, role: str) -> str:
    """Helper: register a user and return their access token."""
    resp = await client.post("/api/v1/auth/register", json={
        "email": email,
        "password": "password123",
        "role": role,
    })
    return resp.json()["access_token"]


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_create_help_request(client: AsyncClient):
    """Test seeker can create a help request."""
    token = await _register_and_get_token(client, "seeker1@test.com", "seeker")

    resp = await client.post("/api/v1/help-requests", json={
        "voice_file_id": "fake-voice-file-id",
        "text": "What does this medicine label say?",
        "mode": "hall",
    }, headers=_auth(token))

    assert resp.status_code == 201
    data = resp.json()
    assert data["status"] == "open"
    assert data["voice_file_id"] == "fake-voice-file-id"


@pytest.mark.asyncio
async def test_volunteer_cannot_create_request(client: AsyncClient):
    """Test volunteer cannot create help requests."""
    token = await _register_and_get_token(client, "vol_create@test.com", "volunteer")

    resp = await client.post("/api/v1/help-requests", json={
        "voice_file_id": "fake-voice-file-id",
        "mode": "hall",
    }, headers=_auth(token))

    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_full_request_flow(client: AsyncClient):
    """Test the full flow: create -> claim -> reply -> feedback."""
    # Register users
    seeker_token = await _register_and_get_token(client, "flow_seeker@test.com", "seeker")
    volunteer_token = await _register_and_get_token(client, "flow_vol@test.com", "volunteer")

    # 1. Seeker creates request
    create_resp = await client.post("/api/v1/help-requests", json={
        "voice_file_id": "voice-123",
        "text": "Help me read this",
        "mode": "hall",
    }, headers=_auth(seeker_token))
    assert create_resp.status_code == 201
    request_id = create_resp.json()["id"]

    # 2. Volunteer views hall
    hall_resp = await client.get(
        "/api/v1/help-requests/hall",
        headers=_auth(volunteer_token),
    )
    assert hall_resp.status_code == 200
    assert hall_resp.json()["total"] >= 1

    # 3. Volunteer claims
    claim_resp = await client.post(
        f"/api/v1/help-requests/{request_id}/claim",
        headers=_auth(volunteer_token),
    )
    assert claim_resp.status_code == 200

    # 4. Verify status changed
    detail_resp = await client.get(
        f"/api/v1/help-requests/{request_id}",
        headers=_auth(volunteer_token),
    )
    assert detail_resp.json()["status"] == "claimed"

    # 5. Volunteer replies
    reply_resp = await client.post(
        f"/api/v1/help-requests/{request_id}/replies",
        json={"reply_type": "text", "text": "This is ibuprofen 200mg, take 1 tablet every 6 hours."},
        headers=_auth(volunteer_token),
    )
    assert reply_resp.status_code == 201

    # 6. Seeker gives feedback
    feedback_resp = await client.post(
        f"/api/v1/help-requests/{request_id}/feedback",
        json={"resolved": True, "comment": "Thank you!"},
        headers=_auth(seeker_token),
    )
    assert feedback_resp.status_code == 201
    assert feedback_resp.json()["resolved"] is True
    assert feedback_resp.json()["request_status"] == "resolved"


@pytest.mark.asyncio
async def test_cancel_request(client: AsyncClient):
    """Test seeker can cancel their open request."""
    token = await _register_and_get_token(client, "cancel_seeker@test.com", "seeker")

    create_resp = await client.post("/api/v1/help-requests", json={
        "voice_file_id": "voice-cancel",
        "mode": "hall",
    }, headers=_auth(token))
    request_id = create_resp.json()["id"]

    cancel_resp = await client.post(
        f"/api/v1/help-requests/{request_id}/cancel",
        headers=_auth(token),
    )
    assert cancel_resp.status_code == 200
    assert cancel_resp.json()["status"] == "cancelled"


@pytest.mark.asyncio
async def test_create_text_only_help_request(client: AsyncClient):
    """Text-only create should work without voice_file_id."""
    token = await _register_and_get_token(client, "text_only@test.com", "seeker")

    resp = await client.post(
        "/api/v1/help-requests",
        json={"text": "Only text payload", "mode": "hall"},
        headers=_auth(token),
    )

    assert resp.status_code == 201
    data = resp.json()
    assert data["raw_text"] == "Only text payload"


@pytest.mark.asyncio
async def test_seeker_can_list_own_requests(client: AsyncClient):
    """Seeker should be able to query /help-requests/mine and see their own items."""
    seeker_token = await _register_and_get_token(client, "mine_owner@test.com", "seeker")
    other_seeker_token = await _register_and_get_token(client, "mine_other@test.com", "seeker")

    create_resp = await client.post(
        "/api/v1/help-requests",
        json={"text": "owner request", "mode": "hall"},
        headers=_auth(seeker_token),
    )
    assert create_resp.status_code == 201
    owner_request_id = create_resp.json()["id"]

    other_create_resp = await client.post(
        "/api/v1/help-requests",
        json={"text": "other request", "mode": "hall"},
        headers=_auth(other_seeker_token),
    )
    assert other_create_resp.status_code == 201

    mine_resp = await client.get("/api/v1/help-requests/mine", headers=_auth(seeker_token))
    assert mine_resp.status_code == 200
    payload = mine_resp.json()
    assert payload["total"] >= 1
    assert any(item["id"] == owner_request_id for item in payload["items"])
    assert all(item["seeker_id"] == create_resp.json()["seeker_id"] for item in payload["items"])


@pytest.mark.asyncio
async def test_request_attachments_include_file_url(client: AsyncClient):
    """Help request attachment response should contain file_url for rendering."""
    token = await _register_and_get_token(client, "attachment_url@test.com", "seeker")

    create_resp = await client.post(
        "/api/v1/help-requests",
        json={
            "text": "Need attachment rendering",
            "mode": "hall",
            "image_file_ids": ["img-file-1"],
            "voice_file_id": "voice-file-1",
            "voice_file_ids": ["voice-file-1"],
        },
        headers=_auth(token),
    )
    assert create_resp.status_code == 201
    data = create_resp.json()
    assert any(att["file_url"] == "/uploads/img-file-1/content" for att in data["attachments"])
    assert any(att["file_url"] == "/uploads/voice-file-1/content" for att in data["attachments"])
