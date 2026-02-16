"""Auth business logic."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token
from app.modules.auth.models import User, UserSettings
from app.modules.auth.schemas import RegisterRequest


async def register_user(db: AsyncSession, payload: RegisterRequest) -> User:
    """Create a new user with the given role."""
    # Check duplicate
    if payload.phone:
        existing = await db.execute(select(User).where(User.phone == payload.phone))
        if existing.scalar_one_or_none():
            raise ValueError("Phone already registered")
    if payload.email:
        existing = await db.execute(select(User).where(User.email == payload.email))
        if existing.scalar_one_or_none():
            raise ValueError("Email already registered")

    user = User(
        role=payload.role,
        phone=payload.phone,
        email=payload.email,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    await db.flush()

    # Create default settings
    user_settings = UserSettings(user_id=user.id)
    db.add(user_settings)
    await db.flush()

    return user


async def authenticate_user(db: AsyncSession, account: str, password: str) -> User | None:
    """Authenticate by phone or email."""
    result = await db.execute(
        select(User).where((User.phone == account) | (User.email == account))
    )
    user = result.scalar_one_or_none()
    if user and verify_password(password, user.password_hash):
        return user
    return None


def generate_tokens(user: User) -> dict:
    """Generate access + refresh token pair."""
    data = {"sub": user.id, "role": user.role}
    return {
        "access_token": create_access_token(data),
        "refresh_token": create_refresh_token(data),
        "token_type": "bearer",
        "role": user.role,
    }
