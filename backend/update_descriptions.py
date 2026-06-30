"""Update menu descriptions without touching other data."""

import asyncio
from sqlalchemy import select, update
from app.core.database import AsyncSessionLocal, engine
from app.menus.models import MenuItem


DESCRIPTIONS = {
    "김치찌개": "얼큰하게 속이 풀리는 한 그릇",
    "된장찌개": "할머니 손맛 그대로 구수하게",
    "제육볶음": "매콤 달콤, 밥 한 공기 순삭",
    "비빔밥": "오늘 하루의 균형을 담았습니다",
    "계란말이": "한 입에 사르르 녹는 부드러움",
    "김치전": "비 오는 날엔 이거지",
    "콜라": "톡 쏘는 청량감 한 잔",
    "사이다": "깔끔하게 입안을 헹구는 한 모금",
    "소주": "오늘 하루도 수고했어요",
    "맥주": "시원하게 한 잔, 걱정은 내일로",
}


async def main():
    async with AsyncSessionLocal() as db:
        for name, desc in DESCRIPTIONS.items():
            await db.execute(
                update(MenuItem).where(MenuItem.name == name).values(description=desc)
            )
        await db.commit()

    print("✅ 메뉴 설명 업데이트 완료! (이미지 URL은 그대로 유지)")


if __name__ == "__main__":
    asyncio.run(main())
