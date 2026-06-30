"""Menu service for CRUD and ordering."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ConflictException, NotFoundException
from app.menus.models import Category, MenuItem
from app.menus.schemas import MenuItemCreate, MenuItemUpdate, MenuOrderUpdate


class MenuService:
    """Service for menu operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    # --- Categories ---

    async def get_categories(self, store_id: str) -> list[Category]:
        """Get all categories for a store, ordered by sort_order."""
        result = await self.db.execute(
            select(Category)
            .where(Category.store_id == store_id)
            .order_by(Category.sort_order)
        )
        return list(result.scalars().all())

    async def create_category(self, store_id: str, name: str, sort_order: int = 0) -> Category:
        """Create a new category."""
        # Check uniqueness
        existing = await self.db.execute(
            select(Category).where(
                Category.store_id == store_id, Category.name == name
            )
        )
        if existing.scalar_one_or_none():
            raise ConflictException(f"Category '{name}' already exists")

        category = Category(store_id=store_id, name=name, sort_order=sort_order)
        self.db.add(category)
        await self.db.flush()
        return category

    # --- Menu Items ---

    async def get_menus(self, store_id: str, category_id: int | None = None) -> list[MenuItem]:
        """Get menu items, optionally filtered by category."""
        query = select(MenuItem).where(
            MenuItem.store_id == store_id, MenuItem.is_active == True  # noqa: E712
        )
        if category_id:
            query = query.where(MenuItem.category_id == category_id)
        query = query.order_by(MenuItem.sort_order)

        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def create_menu(self, store_id: str, data: MenuItemCreate) -> MenuItem:
        """Create a new menu item."""
        # Validate category exists and belongs to store
        await self._validate_category(store_id, data.category_id)

        # Determine sort_order (last in category)
        result = await self.db.execute(
            select(MenuItem)
            .where(
                MenuItem.store_id == store_id,
                MenuItem.category_id == data.category_id,
            )
            .order_by(MenuItem.sort_order.desc())
            .limit(1)
        )
        last_item = result.scalar_one_or_none()
        next_order = (last_item.sort_order + 1) if last_item else 0

        item = MenuItem(
            store_id=store_id,
            category_id=data.category_id,
            name=data.name,
            price=data.price,
            description=data.description,
            image_url=data.image_url,
            sort_order=next_order,
        )
        self.db.add(item)
        await self.db.flush()
        return item

    async def update_menu(self, menu_id: int, store_id: str, data: MenuItemUpdate) -> MenuItem:
        """Update an existing menu item."""
        item = await self._get_menu_item(menu_id, store_id)

        if data.category_id is not None:
            await self._validate_category(store_id, data.category_id)
            item.category_id = data.category_id
        if data.name is not None:
            item.name = data.name
        if data.price is not None:
            item.price = data.price
        if data.description is not None:
            item.description = data.description
        if data.image_url is not None:
            item.image_url = data.image_url

        await self.db.flush()
        return item

    async def delete_menu(self, menu_id: int, store_id: str) -> None:
        """Soft-delete a menu item (set is_active=False)."""
        item = await self._get_menu_item(menu_id, store_id)
        item.is_active = False

    async def update_menu_order(self, store_id: str, data: MenuOrderUpdate) -> None:
        """Update sort_order for multiple menu items."""
        for order_item in data.items:
            item = await self._get_menu_item(order_item.menu_id, store_id)
            item.sort_order = order_item.sort_order

    # --- Helpers ---

    async def _get_menu_item(self, menu_id: int, store_id: str) -> MenuItem:
        """Get a menu item by ID, ensuring it belongs to the store."""
        result = await self.db.execute(
            select(MenuItem).where(MenuItem.id == menu_id, MenuItem.store_id == store_id)
        )
        item = result.scalar_one_or_none()
        if not item:
            raise NotFoundException(f"Menu item {menu_id} not found")
        return item

    async def _validate_category(self, store_id: str, category_id: int) -> None:
        """Validate that a category exists and belongs to the store."""
        result = await self.db.execute(
            select(Category).where(
                Category.id == category_id, Category.store_id == store_id
            )
        )
        if not result.scalar_one_or_none():
            raise NotFoundException(f"Category {category_id} not found")
