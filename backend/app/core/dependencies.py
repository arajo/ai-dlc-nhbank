"""FastAPI dependencies for authentication and database."""

from fastapi import Depends, Header

from app.core.exceptions import AuthenticationException
from app.core.security import decode_access_token


async def get_token_payload(authorization: str = Header(...)) -> dict:
    """Extract and validate JWT token from Authorization header."""
    if not authorization.startswith("Bearer "):
        raise AuthenticationException("Invalid authorization header")

    token = authorization[7:]  # Strip "Bearer "
    payload = decode_access_token(token)
    if payload is None:
        raise AuthenticationException("Invalid or expired token")

    return payload


async def get_current_admin(payload: dict = Depends(get_token_payload)) -> dict:
    """Verify the token belongs to an admin user."""
    if payload.get("type") != "admin":
        raise AuthenticationException("Admin access required")
    return payload


async def get_current_table(payload: dict = Depends(get_token_payload)) -> dict:
    """Verify the token belongs to a table user."""
    if payload.get("type") != "table":
        raise AuthenticationException("Table access required")
    return payload
