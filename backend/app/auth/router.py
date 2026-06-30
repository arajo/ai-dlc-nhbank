"""Authentication API endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.schemas import AdminLoginRequest, TableLoginRequest, TableTokenResponse, TokenResponse
from app.auth.service import AuthService
from app.core.database import get_db

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
