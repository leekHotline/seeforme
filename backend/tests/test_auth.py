"""Tests for auth: registration and login."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_seeker(client: AsyncClient):
    """Test registering a new seeker user."""
    resp = await client.post("/api/v1/auth/register", json={
        "email": "seeker@test.com",
        "password": "password123",
        "role": "seeker",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["access_token"]
    assert data["refresh_token"]
    assert data["role"] == "seeker"


@pytest.mark.asyncio
async def test_register_volunteer(client: AsyncClient):
    """Test registering a new volunteer user."""
    resp = await client.post("/api/v1/auth/register", json={
        "email": "volunteer@test.com",
        "password": "password123",
        "role": "volunteer",
    })
    assert resp.status_code == 201
    assert resp.json()["role"] == "volunteer"


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient):
    """Test that duplicate email registration is rejected."""
    await client.post("/api/v1/auth/register", json={
        "email": "dup@test.com",
        "password": "password123",
        "role": "seeker",
    })
    resp = await client.post("/api/v1/auth/register", json={
        "email": "dup@test.com",
        "password": "password123",
        "role": "seeker",
    })
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    """Test successful login."""
    await client.post("/api/v1/auth/register", json={
        "email": "login@test.com",
        "password": "password123",
        "role": "seeker",
    })
    resp = await client.post("/api/v1/auth/login", json={
        "account": "login@test.com",
        "password": "password123",
    })
    assert resp.status_code == 200
    assert resp.json()["access_token"]


@pytest.mark.asyncio
async def test_login_invalid_password(client: AsyncClient):
    """Test login with wrong password."""
    await client.post("/api/v1/auth/register", json={
        "email": "wrongpw@test.com",
        "password": "password123",
        "role": "seeker",
    })
    resp = await client.post("/api/v1/auth/login", json={
        "account": "wrongpw@test.com",
        "password": "wrongpassword",
    })
    assert resp.status_code == 401
