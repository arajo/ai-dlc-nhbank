"""Test configuration and fixtures."""

import asyncio
import uuid
from collections.abc import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.auth.models import Store
from app.core.database import Base, get_db
from app.core.security import create_access_token, hash_password
from app.main import app

# Test database (in-memory SQLite)
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSessionLocal = async_sessionmaker(
    test_engine, class_=AsyncSession, expire_on_commit=False
)


@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for the test session."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Provide a clean database session for each test."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestSessionLocal() as session:
        yield session

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Provide an async HTTP client with test database."""

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def test_store(db_session: AsyncSession) -> Store:
    """Create a test store."""
    store = Store(
        id=str(uuid.uuid4()),
        name="Test Store",
        username="admin",
        password_hash=hash_password("password123"),
    )
    db_session.add(store)
    await db_session.commit()
    return store


@pytest.fixture
def admin_token(test_store: Store) -> str:
    """Create a valid admin JWT token."""
    return create_access_token(data={"sub": test_store.id, "type": "admin"})


@pytest.fixture
def admin_headers(admin_token: str) -> dict:
    """HTTP headers with admin authorization."""
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture
def table_token(test_store: Store) -> str:
    """Create a valid table JWT token."""
    return create_access_token(
        data={
            "sub": test_store.id,
            "type": "table",
            "table_id": 1,
            "table_number": 1,
        }
    )


@pytest.fixture
def table_headers(table_token: str) -> dict:
    """HTTP headers with table authorization."""
    return {"Authorization": f"Bearer {table_token}"}
