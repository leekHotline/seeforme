"""Database engine and session configuration (async SQLAlchemy)."""

from __future__ import annotations

import logging

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

engine = create_async_engine(settings.DATABASE_URL, echo=settings.DEBUG)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
logger = logging.getLogger(__name__)


class Base(DeclarativeBase):
    """Base class for all ORM models."""
    pass


async def get_db() -> AsyncSession:
    """FastAPI dependency that yields an async database session."""
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """Create all tables (for development / testing)."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await _ensure_schema_compatibility(conn)


async def _ensure_schema_compatibility(conn) -> None:
    """Apply lightweight compatibility patches for existing dev SQLite databases."""
    if conn.dialect.name != "sqlite":
        return

    # NOTE:
    # `create_all()` does not alter existing tables.
    # Older local DBs may miss columns added later in models.
    async def _table_columns(table_name: str) -> set[str]:
        table_info = await conn.execute(text(f"PRAGMA table_info({table_name})"))
        return {row[1] for row in table_info.fetchall()}

    columns = await _table_columns("help_requests")

    if "priority" not in columns:
        await conn.execute(
            text(
                "ALTER TABLE help_requests "
                "ADD COLUMN priority SMALLINT NOT NULL DEFAULT 0"
            )
        )
        logger.warning(
            "Applied SQLite compatibility patch: added help_requests.priority"
        )

    upload_columns_before = await _table_columns("uploaded_files")
    legacy_upload_schema = any(
        column in upload_columns_before
        for column in ("owner_user_id", "storage_key", "size_bytes")
    )

    if legacy_upload_schema:
        user_expr: str
        if "user_id" in upload_columns_before and "owner_user_id" in upload_columns_before:
            user_expr = "COALESCE(user_id, owner_user_id, (SELECT id FROM users LIMIT 1))"
        elif "user_id" in upload_columns_before:
            user_expr = "COALESCE(user_id, (SELECT id FROM users LIMIT 1))"
        elif "owner_user_id" in upload_columns_before:
            user_expr = "COALESCE(owner_user_id, (SELECT id FROM users LIMIT 1))"
        else:
            user_expr = "(SELECT id FROM users LIMIT 1)"

        if "filename" in upload_columns_before and "storage_key" in upload_columns_before:
            filename_expr = "COALESCE(NULLIF(filename, ''), storage_key, 'legacy-file')"
        elif "filename" in upload_columns_before:
            filename_expr = "COALESCE(NULLIF(filename, ''), 'legacy-file')"
        elif "storage_key" in upload_columns_before:
            filename_expr = "COALESCE(storage_key, 'legacy-file')"
        else:
            filename_expr = "'legacy-file'"

        if "size" in upload_columns_before and "size_bytes" in upload_columns_before:
            size_expr = "COALESCE(NULLIF(size, 0), size_bytes, 0)"
        elif "size" in upload_columns_before:
            size_expr = "COALESCE(size, 0)"
        elif "size_bytes" in upload_columns_before:
            size_expr = "COALESCE(size_bytes, 0)"
        else:
            size_expr = "0"

        if "category" in upload_columns_before:
            category_expr = "COALESCE(NULLIF(category, ''), 'image')"
        else:
            category_expr = "'image'"

        created_at_expr = "created_at" if "created_at" in upload_columns_before else "CURRENT_TIMESTAMP"

        await conn.execute(text("DROP TABLE IF EXISTS uploaded_files__new"))
        await conn.execute(
            text(
                "CREATE TABLE uploaded_files__new ("
                "id VARCHAR(36) NOT NULL PRIMARY KEY, "
                "user_id VARCHAR(36) NOT NULL, "
                "filename VARCHAR(255) NOT NULL, "
                "mime_type VARCHAR(100) NOT NULL, "
                "size INTEGER NOT NULL, "
                "category VARCHAR(20) NOT NULL, "
                "created_at DATETIME NOT NULL, "
                "FOREIGN KEY(user_id) REFERENCES users (id)"
                ")"
            )
        )
        await conn.execute(
            text(
                "INSERT INTO uploaded_files__new "
                "(id, user_id, filename, mime_type, size, category, created_at) "
                "SELECT "
                f"id, {user_expr}, {filename_expr}, mime_type, {size_expr}, {category_expr}, {created_at_expr} "
                "FROM uploaded_files"
            )
        )
        await conn.execute(text("DROP TABLE uploaded_files"))
        await conn.execute(text("ALTER TABLE uploaded_files__new RENAME TO uploaded_files"))
        logger.warning(
            "Applied SQLite compatibility patch: rebuilt uploaded_files from legacy schema"
        )

    upload_columns_after = await _table_columns("uploaded_files")
    if "user_id" not in upload_columns_after:
        await conn.execute(text("ALTER TABLE uploaded_files ADD COLUMN user_id VARCHAR(36)"))
    if "filename" not in upload_columns_after:
        await conn.execute(
            text("ALTER TABLE uploaded_files ADD COLUMN filename VARCHAR(255) NOT NULL DEFAULT ''")
        )
    if "size" not in upload_columns_after:
        await conn.execute(
            text("ALTER TABLE uploaded_files ADD COLUMN size INTEGER NOT NULL DEFAULT 0")
        )
    if "category" not in upload_columns_after:
        await conn.execute(
            text(
                "ALTER TABLE uploaded_files "
                "ADD COLUMN category VARCHAR(20) NOT NULL DEFAULT 'image'"
            )
        )
    if "storage_path" not in upload_columns_after:
        await conn.execute(
            text("ALTER TABLE uploaded_files ADD COLUMN storage_path VARCHAR(500)")
        )

    final_upload_columns = await _table_columns("uploaded_files")
    if upload_columns_before != final_upload_columns:
        logger.warning(
            "Applied SQLite compatibility patch: synced uploaded_files columns"
        )
