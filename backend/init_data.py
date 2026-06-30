"""Initialize database with sample store, tables, categories, and menus."""

import asyncio

from app.core.database import init_db, AsyncSessionLocal
from app.core.security import hash_password
from app.auth.models import Store
from app.tables.models import Table, TableSession
from app.menus.models import Category, MenuItem
from app.orders.models import Order, OrderItem, OrderHistory, OrderCounter  # noqa: F401


async def main():
    await init_db()

    async with AsyncSessionLocal() as db:
        # 1. Create store (매장)
        store = Store(
            id="store-001",
            name="맛있는 식당",
            username="admin",
            password_hash=hash_password("1234"),
        )
        db.add(store)

        # 2. Create tables (테이블 3개)
        for i in range(1, 4):
            table = Table(
                store_id="store-001",
                number=i,
                password_hash=hash_password("0000"),
            )
            db.add(table)

        # 3. Create categories
        cat1 = Category(store_id="store-001", name="메인", sort_order=0)
        cat2 = Category(store_id="store-001", name="사이드", sort_order=1)
        cat3 = Category(store_id="store-001", name="음료", sort_order=2)
        db.add_all([cat1, cat2, cat3])
        await db.flush()

        # 4. Create menu items (loremflickr: real food photos, free, direct link)
        menus = [
            MenuItem(store_id="store-001", category_id=cat1.id, name="김치찌개", price=9000, description="얼큰한 김치찌개", sort_order=0, image_url="https://loremflickr.com/400/300/kimchi,stew"),
            MenuItem(store_id="store-001", category_id=cat1.id, name="된장찌개", price=8000, description="구수한 된장찌개", sort_order=1, image_url="https://loremflickr.com/400/300/miso,soup"),
            MenuItem(store_id="store-001", category_id=cat1.id, name="제육볶음", price=10000, description="매콤한 제육볶음", sort_order=2, image_url="https://loremflickr.com/400/300/pork,stir-fry"),
            MenuItem(store_id="store-001", category_id=cat1.id, name="비빔밥", price=9000, description="야채 비빔밥", sort_order=3, image_url="https://loremflickr.com/400/300/bibimbap"),
            MenuItem(store_id="store-001", category_id=cat2.id, name="계란말이", price=5000, description="부드러운 계란말이", sort_order=0, image_url="https://loremflickr.com/400/300/egg,omelette"),
            MenuItem(store_id="store-001", category_id=cat2.id, name="김치전", price=6000, description="바삭한 김치전", sort_order=1, image_url="https://loremflickr.com/400/300/korean,pancake"),
            MenuItem(store_id="store-001", category_id=cat3.id, name="콜라", price=2000, sort_order=0, image_url="https://loremflickr.com/400/300/coca-cola"),
            MenuItem(store_id="store-001", category_id=cat3.id, name="사이다", price=2000, sort_order=1, image_url="https://loremflickr.com/400/300/sprite,soda"),
            MenuItem(store_id="store-001", category_id=cat3.id, name="소주", price=5000, sort_order=2, image_url="https://loremflickr.com/400/300/soju,korean"),
            MenuItem(store_id="store-001", category_id=cat3.id, name="맥주", price=5000, sort_order=3, image_url="https://loremflickr.com/400/300/beer,glass"),
        ]
        db.add_all(menus)
        await db.commit()

    print("✅ 초기 데이터 생성 완료!")
    print()
    print("=== 로그인 정보 ===")
    print("관리자 로그인:")
    print("  매장 ID: store-001")
    print("  사용자명: admin")
    print("  비밀번호: 1234")
    print()
    print("테이블 로그인 (1~3번 테이블):")
    print("  매장 ID: store-001")
    print("  테이블 번호: 1 (또는 2, 3)")
    print("  비밀번호: 0000")


if __name__ == "__main__":
    asyncio.run(main())
