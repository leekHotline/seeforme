"""FastAPI exception handlers with unified code/message/data payload."""

from __future__ import annotations

import logging
from typing import Any

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

from app.core.errors import (
    HTTP_STATUS_CODE_MAP,
    AppException,
    ErrorCode,
    build_error_payload,
)

logger = logging.getLogger(__name__)


def _resolve_http_error_message(detail: Any) -> str:
    if isinstance(detail, str):
        return detail
    if isinstance(detail, list):
        return "Request validation failed"
    return "Request failed"


def register_exception_handlers(app: FastAPI) -> None:
    """Register global exception handlers."""

    @app.exception_handler(AppException)
    async def _handle_app_exception(
        request: Request, exc: AppException
    ) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content=build_error_payload(
                code=exc.code,
                message=exc.message,
                data=exc.data,
            ),
        )

    @app.exception_handler(RequestValidationError)
    async def _handle_validation_exception(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=422,
            content=build_error_payload(
                code=int(ErrorCode.VALIDATION_ERROR),
                message="Request validation failed",
                data={"errors": exc.errors()},
            ),
        )

    @app.exception_handler(HTTPException)
    async def _handle_http_exception(
        request: Request, exc: HTTPException
    ) -> JSONResponse:
        mapped_code = HTTP_STATUS_CODE_MAP.get(exc.status_code, ErrorCode.BAD_REQUEST)
        return JSONResponse(
            status_code=exc.status_code,
            content=build_error_payload(
                code=int(mapped_code),
                message=_resolve_http_error_message(exc.detail),
                data=None,
            ),
        )

    @app.exception_handler(SQLAlchemyError)
    async def _handle_db_exception(
        request: Request, exc: SQLAlchemyError
    ) -> JSONResponse:
        logger.exception("Database exception occurred")
        return JSONResponse(
            status_code=500,
            content=build_error_payload(
                code=int(ErrorCode.DATABASE_ERROR),
                message="Database operation failed",
                data=None,
            ),
        )

    @app.exception_handler(Exception)
    async def _handle_unexpected_exception(
        request: Request, exc: Exception
    ) -> JSONResponse:
        logger.exception("Unhandled exception occurred")
        return JSONResponse(
            status_code=500,
            content=build_error_payload(
                code=int(ErrorCode.INTERNAL_ERROR),
                message="Internal server error",
                data=None,
            ),
        )

