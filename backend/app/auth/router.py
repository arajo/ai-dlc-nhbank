"""Authentication API endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import Store
from app.auth.schemas import AdminLoginRequest, StoreCreateRequest, StoreResponse, StoreUpdateRequest, TableLoginRequest, TableTokenResponse, TokenResponse
from app.auth.service import AuthService
from app.core.database import get_db
from app.core.exceptions import ConflictException
from app.core.security import hash_password

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/admin/login", response_model=TokenResponse)
async def admin_login(request: AdminLoginRequest, db: AsyncSession = Depends(get_db)):
    """Admin login endpoint."""
    service = AuthService(db)
    result = await service.login_admin(
        store_id=request.store_id,
        username=request.username,
        password=request.password,
    )
    return result


@router.post("/table/login", response_model=TableTokenResponse)
async def table_login(request: TableLoginRequest, db: AsyncSession = Depends(get_db)):
    """Table login endpoint."""
    service = AuthService(db)
    result = await service.login_table(
        store_id=request.store_id,
        table_number=request.table_number,
        password=request.password,
    )
    return result


@router.post("/stores", response_model=StoreResponse, status_code=201)
async def create_store(request: StoreCreateRequest, db: AsyncSession = Depends(get_db)):
    """Create a new store (super admin)."""
    # Check if ID already exists
    existing_id = await db.execute(select(Store).where(Store.id == request.id))
    if existing_id.scalar_one_or_none():
        raise ConflictException(f"Store ID '{request.id}' already exists")

    # Check if username already exists
    existing = await db.execute(select(Store).where(Store.username == request.username))
    if existing.scalar_one_or_none():
        raise ConflictException(f"Username '{request.username}' already exists")

    store = Store(
        id=request.id,
        name=request.name,
        username=request.username,
        password_hash=hash_password(request.password),
    )
    db.add(store)
    await db.flush()
    return store


@router.put("/stores/{store_id}", response_model=StoreResponse)
async def update_store(store_id: str, request: StoreUpdateRequest, db: AsyncSession = Depends(get_db)):
    """Update a store (super admin)."""
    result = await db.execute(select(Store).where(Store.id == store_id))
    store = result.scalar_one_or_none()
    if not store:
        from app.core.exceptions import NotFoundException
        raise NotFoundException(f"Store '{store_id}' not found")

    if request.name is not None:
        store.name = request.name
    if request.username is not None:
        # Check uniqueness
        existing = await db.execute(select(Store).where(Store.username == request.username, Store.id != store_id))
        if existing.scalar_one_or_none():
            raise ConflictException(f"Username '{request.username}' already exists")
        store.username = request.username
    if request.password is not None:
        store.password_hash = hash_password(request.password)
    if request.id is not None and request.id != store_id:
        # Change store ID
        existing_id = await db.execute(select(Store).where(Store.id == request.id))
        if existing_id.scalar_one_or_none():
            raise ConflictException(f"Store ID '{request.id}' already exists")
        store.id = request.id

    await db.flush()
    return store


@router.get("/stores", response_model=list[StoreResponse])
async def list_stores(db: AsyncSession = Depends(get_db)):
    """List all stores (super admin)."""
    result = await db.execute(select(Store))
    return list(result.scalars().all())


@router.get("/stores/{store_id}/tables")
async def list_store_tables(store_id: str, db: AsyncSession = Depends(get_db)):
    """List all tables for a specific store (super admin)."""
    from app.tables.models import Table
    result = await db.execute(
        select(Table).where(Table.store_id == store_id, Table.is_active == True).order_by(Table.number)
    )
    tables = result.scalars().all()
    return [{"id": t.id, "number": t.number, "has_session": t.current_session_id is not None} for t in tables]
