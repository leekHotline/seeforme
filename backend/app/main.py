"""SeeForMe / 为你所见 — FastAPI application entry point."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.db import init_db

# Import all routers
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


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: initialize DB on startup."""
    await init_db()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

# CORS (allow all for development)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all routers under /api/v1
app.include_router(auth_router, prefix=settings.API_V1_PREFIX)
app.include_router(users_router, prefix=settings.API_V1_PREFIX)
app.include_router(help_requests_router, prefix=settings.API_V1_PREFIX)
app.include_router(assignments_router, prefix=settings.API_V1_PREFIX)
app.include_router(replies_router, prefix=settings.API_V1_PREFIX)
app.include_router(feedback_router, prefix=settings.API_V1_PREFIX)
app.include_router(uploads_router, prefix=settings.API_V1_PREFIX)
app.include_router(moderation_router, prefix=settings.API_V1_PREFIX)
app.include_router(notifications_router, prefix=settings.API_V1_PREFIX)
app.include_router(ai_assist_router, prefix=settings.API_V1_PREFIX)
app.include_router(image_analysis_router, prefix=settings.API_V1_PREFIX)


@app.get("/")
async def root():
    """Health check endpoint."""
    return {"name": settings.APP_NAME, "version": settings.APP_VERSION, "status": "ok"}
