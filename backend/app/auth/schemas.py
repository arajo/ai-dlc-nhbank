"""Authentication request/response schemas."""

from pydantic import BaseModel, Field


class AdminLoginRequest(BaseModel):
    """Admin login request."""

    store_id: str = Field(..., min_length=1, max_length=36)
    username: str = Field(..., min_length=1, max_length=50)
    password: str = Field(..., min_length=1, max_length=100)


class TableLoginRequest(BaseModel):
    """Table login request."""

    store_id: str = Field(..., min_length=1, max_length=36)
    table_number: int = Field(..., ge=1)
    password: str = Field(..., min_length=1, max_length=100)


class TokenResponse(BaseModel):
    """JWT token response."""

    access_token: str
    token_type: str = "bearer"
    expires_in: int


class TableTokenResponse(TokenResponse):
    """Table-specific token response with table info."""

    table_id: int
    store_id: str
    table_number: int
