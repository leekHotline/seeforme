"""Auth API routes."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.security import decode_token
from app.modules.auth import schemas, service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post(
    "/register",
    response_model=schemas.AuthTokenResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register(
    payload: schemas.RegisterRequest,
    db: AsyncSession = Depends(get_db),
) -> schemas.AuthTokenResponse:
    """Register a new user. Role is fixed at registration time."""
    if not payload.phone and not payload.email:
        raise HTTPException(status_code=400, detail="Phone or email is required")
    try:
        user = await service.register_user(db, payload)
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))

    tokens = service.generate_tokens(user)
    return schemas.AuthTokenResponse(**tokens)


@router.post("/login", response_model=schemas.AuthTokenResponse)
async def login(
    payload: schemas.LoginRequest,
    db: AsyncSession = Depends(get_db),
) -> schemas.AuthTokenResponse:
    """Login with phone/email and password."""
    user = await service.authenticate_user(db, payload.account, payload.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    tokens = service.generate_tokens(user)
    return schemas.AuthTokenResponse(**tokens)


@router.post("/refresh", response_model=schemas.AuthTokenResponse)
async def refresh_token(
    payload: schemas.RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
) -> schemas.AuthTokenResponse:
    """Refresh an access token using a refresh token."""
    token_data = decode_token(payload.refresh_token)
    if token_data.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    from app.modules.auth.models import User
    from sqlalchemy import select

    user_id = token_data.get("sub")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")

    tokens = service.generate_tokens(user)
    return schemas.AuthTokenResponse(**tokens)
