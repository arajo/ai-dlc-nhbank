"""Menu API endpoints."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_admin, get_token_payload
from app.menus.schemas import (
    CategoryCreate,
    CategoryResponse,
    MenuItemCreate,
    MenuItemResponse,
    MenuItemUpdate,
    MenuOrderUpdate,
)
from app.menus.service import MenuService

router = APIRouter(prefix="/api/menus", tags=["Menus"])


# --- Public (any authenticated user) ---


@router.get("", response_model=list[MenuItemResponse])
async def get_menus(
    category_id: int | None = Query(default=None),
    payload: dict = Depends(get_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """Get all active menu items, optionally filtered by category."""
    store_id = payload["sub"]
    service = MenuService(db)
    items = await service.get_menus(store_id, category_id)
    return items


@router.get("/categories", response_model=list[CategoryResponse])
async def get_categories(
    payload: dict = Depends(get_token_payload),
    db: AsyncSession = Depends(get_db),
):
    """Get all categories for the store."""
    store_id = payload["sub"]
    service = MenuService(db)
    categories = await service.get_categories(store_id)
    return categories


# --- Admin only ---


@router.post("/categories", response_model=CategoryResponse, status_code=201)
async def create_category(
    request: CategoryCreate,
    admin: dict = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Create a new category (admin only)."""
    store_id = admin["sub"]
    service = MenuService(db)
    category = await service.create_category(store_id, request.name, request.sort_order)
    return category


@router.post("", response_model=MenuItemResponse, status_code=201)
async def create_menu(
    request: MenuItemCreate,
    admin: dict = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Create a new menu item (admin only)."""
    store_id = admin["sub"]
    service = MenuService(db)
    item = await service.create_menu(store_id, request)
    return item


@router.put("/{menu_id}", response_model=MenuItemResponse)
async def update_menu(
    menu_id: int,
    request: MenuItemUpdate,
    admin: dict = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Update a menu item (admin only)."""
    store_id = admin["sub"]
    service = MenuService(db)
    item = await service.update_menu(menu_id, store_id, request)
    return item


@router.delete("/{menu_id}", status_code=204)
async def delete_menu(
    menu_id: int,
    admin: dict = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Delete (soft) a menu item (admin only)."""
    store_id = admin["sub"]
    service = MenuService(db)
    await service.delete_menu(menu_id, store_id)


@router.put("/order", status_code=204)
async def update_menu_order(
    request: MenuOrderUpdate,
    admin: dict = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Update menu display order (admin only)."""
    store_id = admin["sub"]
    service = MenuService(db)
    await service.update_menu_order(store_id, request)
