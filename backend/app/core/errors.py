"""Unified API error codes and exception helpers."""

from __future__ import annotations

from enum import IntEnum
from typing import Any


class ErrorCode(IntEnum):
    """Top-level API error codes."""

    VALIDATION_ERROR = 1001
    AUTHENTICATION_FAILED = 1002
    FORBIDDEN = 1003
    NOT_FOUND = 1004
    CONFLICT = 1005
    BAD_REQUEST = 1006
    DATABASE_ERROR = 1007
    INTERNAL_ERROR = 1099

    # Module range example: help_requests (2001-2099)
    HELP_REQUEST_INVALID_PAYLOAD = 2001


HTTP_STATUS_CODE_MAP: dict[int, ErrorCode] = {
    400: ErrorCode.BAD_REQUEST,
    401: ErrorCode.AUTHENTICATION_FAILED,
    403: ErrorCode.FORBIDDEN,
    404: ErrorCode.NOT_FOUND,
    409: ErrorCode.CONFLICT,
    422: ErrorCode.VALIDATION_ERROR,
    500: ErrorCode.INTERNAL_ERROR,
}


class AppException(Exception):
    """Custom exception carrying business error code and response metadata."""

    def __init__(
        self,
        *,
        code: ErrorCode,
        message: str,
        status_code: int = 400,
        data: Any = None,
    ) -> None:
        super().__init__(message)
        self.code = int(code)
        self.message = message
        self.status_code = status_code
        self.data = data


def build_error_payload(*, code: int, message: str, data: Any = None) -> dict[str, Any]:
    """Build a stable API error payload shape."""
    return {
        "code": code,
        "message": message,
        "data": data,
    }

