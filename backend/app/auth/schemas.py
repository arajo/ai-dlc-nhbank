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


class StoreCreateRequest(BaseModel):
    """Create store request."""

    id: str = Field(..., min_length=1, max_length=36)
    name: str = Field(..., min_length=1, max_length=100)
    username: str = Field(..., min_length=1, max_length=50)
    password: str = Field(..., min_length=1, max_length=100)


class StoreUpdateRequest(BaseModel):
    """Update store request."""

    id: str | None = Field(default=None, min_length=1, max_length=36)
    name: str | None = Field(default=None, min_length=1, max_length=100)
    username: str | None = Field(default=None, min_length=1, max_length=50)
    password: str | None = Field(default=None, min_length=1, max_length=100)


class StoreResponse(BaseModel):
    """Store response."""

    id: str
    name: str
    username: str

    model_config = {"from_attributes": True}
