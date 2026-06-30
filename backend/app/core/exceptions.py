"""Custom exception hierarchy and global error handlers."""

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse


class BaseAppException(Exception):
    """Base exception for application errors."""

    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class NotFoundException(BaseAppException):
    """Resource not found (404)."""

    def __init__(self, message: str = "Resource not found"):
        super().__init__(message=message, status_code=404)


class ValidationException(BaseAppException):
    """Business validation error (422)."""

    def __init__(self, message: str = "Validation error"):
        super().__init__(message=message, status_code=422)


class ConflictException(BaseAppException):
    """Resource conflict (409)."""

    def __init__(self, message: str = "Resource already exists"):
        super().__init__(message=message, status_code=409)


class AuthenticationException(BaseAppException):
    """Authentication failed (401)."""

    def __init__(self, message: str = "Invalid credentials"):
        super().__init__(message=message, status_code=401)


class AccountLockedException(BaseAppException):
    """Account locked due to too many attempts (423)."""

    def __init__(self, minutes_remaining: int = 0):
        message = f"Account locked. Try again in {minutes_remaining} minutes"
        super().__init__(message=message, status_code=423)


class ServiceUnavailableException(BaseAppException):
    """Service temporarily unavailable (503)."""

    def __init__(self, message: str = "Service temporarily unavailable"):
        super().__init__(message=message, status_code=503)


def register_exception_handlers(app: FastAPI) -> None:
    """Register global exception handlers on the FastAPI app."""

    @app.exception_handler(BaseAppException)
    async def app_exception_handler(
        request: Request, exc: BaseAppException
    ) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.message},
        )

    @app.exception_handler(Exception)
    async def general_exception_handler(
        request: Request, exc: Exception
    ) -> JSONResponse:
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"},
        )
