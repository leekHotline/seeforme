"""Shared test fixtures for SeeForMe backend."""

import asyncio
import os
from typing import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.db import Base, get_db

# Import ALL models so Base.metadata knows about every table BEFORE create_all
import app.modules.auth.models  # noqa: F401
import app.modules.help_requests.models  # noqa: F401
import app.modules.assignments.models  # noqa: F401
import app.modules.replies.models  # noqa: F401
import app.modules.feedback.models  # noqa: F401
import app.modules.uploads.models  # noqa: F401
import app.modules.moderation.models  # noqa: F401

# Use a test-specific SQLite file
TEST_DB_PATH = os.path.join(os.path.dirname(__file__), "test.db")
TEST_DATABASE_URL = f"sqlite+aiosqlite:///{TEST_DB_PATH}"


@pytest.fixture(scope="session")
def event_loop():
    """Create a single event loop for the whole test session."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


def _build_app():
    """Build a fresh FastAPI app identical to production but without lifespan."""
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware
    from app.core.config import settings
    from app.modules.auth.router import router as auth_router
    from app.modules.users.router import router as users_router
    from app.modules.help_requests.router import router as help_requests_router
    from app.modules.assignments.router import router as assignments_router
    from app.modules.replies.router import router as replies_router
    from app.modules.feedback.router import router as feedback_router
    from app.modules.uploads.router import router as uploads_router
    from app.modules.moderation.router import router as moderation_router
    from app.modules.notifications.router import router as notifications_router
    from app.modules.ai_assist.router import router as ai_assist_router
    from app.modules.image_analysis.router import router as image_analysis_router

    test_app = FastAPI(title=settings.APP_NAME, version=settings.APP_VERSION)
    test_app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    for r in (
        auth_router, users_router, help_requests_router,
        assignments_router, replies_router, feedback_router,
        uploads_router, moderation_router, notifications_router,
        ai_assist_router, image_analysis_router,
    ):
        test_app.include_router(r, prefix=settings.API_V1_PREFIX)

    return test_app


@pytest_asyncio.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    """Provide an async HTTP client with a fresh DB for each test."""
    # Clean up any leftover test db
    try:
        os.remove(TEST_DB_PATH)
    except OSError:
        pass

    engine = create_async_engine(TEST_DATABASE_URL, echo=False)

    # Create all tables fresh (models are already imported above)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async def _override_get_db():
        async with session_factory() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    test_app = _build_app()
    test_app.dependency_overrides[get_db] = _override_get_db

    transport = ASGITransport(app=test_app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    test_app.dependency_overrides.clear()

    # Clean up
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()

    try:
        os.remove(TEST_DB_PATH)
    except OSError:
        pass
