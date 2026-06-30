"""Menu request/response schemas."""

from pydantic import BaseModel, Field


class CategoryCreate(BaseModel):
    """Create category request."""

    name: str = Field(..., min_length=1, max_length=50)
    sort_order: int = Field(default=0, ge=0)


class CategoryResponse(BaseModel):
    """Category response."""

    id: int
    name: str
    sort_order: int

    model_config = {"from_attributes": True}


class MenuItemCreate(BaseModel):
    """Create menu item request."""

    category_id: int
    name: str = Field(..., min_length=1, max_length=100)
    price: int = Field(..., ge=0)
    description: str | None = None
    image_url: str | None = Field(default=None, max_length=500)


class MenuItemUpdate(BaseModel):
    """Update menu item request."""

    category_id: int | None = None
    name: str | None = Field(default=None, min_length=1, max_length=100)
    price: int | None = Field(default=None, ge=0)
    description: str | None = None
    image_url: str | None = Field(default=None, max_length=500)


class MenuItemResponse(BaseModel):
    """Menu item response."""

    id: int
    category_id: int
    name: str
    price: int
    description: str | None
    image_url: str | None
    sort_order: int
    is_active: bool

    model_config = {"from_attributes": True}


class MenuOrderItem(BaseModel):
    """Menu order update item."""

    menu_id: int
    sort_order: int = Field(..., ge=0)


class MenuOrderUpdate(BaseModel):
    """Batch menu order update request."""

    items: list[MenuOrderItem]
