"""Authentication service with login, JWT, and rate limiting."""

from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.models import LoginAttempt, Store
from app.core.config import settings
from app.core.exceptions import AccountLockedException, AuthenticationException
from app.core.security import create_access_token, hash_password, verify_password
from app.tables.models import Table


class AuthService:
    """Service for authentication operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def login_admin(
        self, store_id: str, username: str, password: str
    ) -> dict:
        """Authenticate admin and return JWT token."""
        # Check lockout
        await self._check_lockout(store_id)

        # Find store
        result = await self.db.execute(
            select(Store).where(Store.id == store_id, Store.username == username)
        )
        store = result.scalar_one_or_none()

        if not store or not verify_password(password, store.password_hash):
            await self._record_failed_attempt(store_id)
            raise AuthenticationException()

        # Success - reset attempts
        await self._reset_attempts(store_id)

        # Create token
        token = create_access_token(
            data={"sub": store_id, "type": "admin"}
        )

        return {
            "access_token": token,
            "token_type": "bearer",
            "expires_in": settings.JWT_EXPIRE_HOURS * 3600,
        }

    async def login_table(
        self, store_id: str, table_number: int, password: str
    ) -> dict:
        """Authenticate table and return JWT token."""
        result = await self.db.execute(
            select(Table).where(
                Table.store_id == store_id,
                Table.number == table_number,
                Table.is_active == True,  # noqa: E712
            )
        )
        table = result.scalar_one_or_none()

        if not table or not verify_password(password, table.password_hash):
            raise AuthenticationException()

        token = create_access_token(
            data={
                "sub": store_id,
                "type": "table",
                "table_id": table.id,
                "table_number": table.number,
            }
        )

        return {
            "access_token": token,
            "token_type": "bearer",
            "expires_in": settings.JWT_EXPIRE_HOURS * 3600,
            "table_id": table.id,
            "store_id": store_id,
            "table_number": table.number,
        }

    async def _check_lockout(self, store_id: str) -> None:
        """Check if account is locked."""
        result = await self.db.execute(
            select(LoginAttempt).where(LoginAttempt.store_id == store_id)
        )
        attempt = result.scalar_one_or_none()

        if attempt and attempt.locked_until:
            now = datetime.now(timezone.utc)
            if now < attempt.locked_until:
                remaining = int((attempt.locked_until - now).total_seconds() / 60) + 1
                raise AccountLockedException(minutes_remaining=remaining)
            else:
                # Lockout expired - reset
                attempt.attempt_count = 0
                attempt.locked_until = None

    async def _record_failed_attempt(self, store_id: str) -> None:
        """Record a failed login attempt."""
        result = await self.db.execute(
            select(LoginAttempt).where(LoginAttempt.store_id == store_id)
        )
        attempt = result.scalar_one_or_none()

        now = datetime.now(timezone.utc)

        if not attempt:
            attempt = LoginAttempt(
                store_id=store_id, attempt_count=1, last_attempt_at=now
            )
            self.db.add(attempt)
        else:
            attempt.attempt_count += 1
            attempt.last_attempt_at = now

            if attempt.attempt_count >= settings.LOGIN_MAX_ATTEMPTS:
                attempt.locked_until = now + timedelta(
                    minutes=settings.LOGIN_LOCKOUT_MINUTES
                )

    async def _reset_attempts(self, store_id: str) -> None:
        """Reset login attempts on successful login."""
        result = await self.db.execute(
            select(LoginAttempt).where(LoginAttempt.store_id == store_id)
        )
        attempt = result.scalar_one_or_none()
        if attempt:
            attempt.attempt_count = 0
            attempt.locked_until = None


def create_store(name: str, username: str, password: str, store_id: str) -> Store:
    """Create a new store entity (utility for setup)."""
    return Store(
        id=store_id,
        name=name,
        username=username,
        password_hash=hash_password(password),
    )
