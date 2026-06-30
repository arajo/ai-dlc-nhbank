# 컴포넌트 의존성 및 통신 패턴

---

## 1. 백엔드 의존성 매트릭스

| 컴포넌트 | 의존하는 대상 |
|----------|---------------|
| `auth/router` | AuthService, core/dependencies |
| `auth/service` | SQLAlchemy Session, core/security |
| `menus/router` | MenuService, core/dependencies |
| `menus/service` | SQLAlchemy Session |
| `orders/router` | OrderService, core/dependencies |
| `orders/service` | SQLAlchemy Session, SSEManager |
| `tables/router` | TableService, core/dependencies |
| `tables/service` | SQLAlchemy Session, OrderService |
| `sse/manager` | (독립 — 인메모리 연결 관리) |
| `health/router` | SQLAlchemy Session |
| `core/dependencies` | AuthService (토큰 검증) |

---

## 2. 의존성 방향 다이어그램

```
+------------------+     +------------------+     +------------------+
|   auth/router    |     |  menus/router    |     |  orders/router   |
+--------+---------+     +--------+---------+     +--------+---------+
         |                        |                        |
         v                        v                        v
+--------+---------+     +--------+---------+     +--------+---------+
|   AuthService    |     |   MenuService    |     |  OrderService    |
+--------+---------+     +--------+---------+     +--------+---------+
         |                        |                        |       |
         v                        v                        v       v
+--------+---------+     +--------+---------+     +--------+--+ +--+--------+
|  core/security   |     |   SQLAlchemy     |     | SQLAlchemy | | SSEManager|
+------------------+     |    Session       |     |  Session   | +-----------+
                          +------------------+     +-----------+
                                                        ^
+------------------+                                    |
|  tables/router   |                                    |
+--------+---------+                                    |
         |                                              |
         v                                              |
+--------+---------+                                    |
|  TableService    +------------------------------------+
+--------+---------+     (OrderService 의존)
         |
         v
+--------+---------+
|   SQLAlchemy     |
|    Session       |
+------------------+
```

---

## 3. 프론트엔드 의존성

```
+---------------------+
|      App Router     |
+----------+----------+
           |
     +-----+------+
     |            |
     v            v
+----+-----+ +---+------+
| Customer | |  Admin   |
|  Pages   | |  Pages   |
+----+-----+ +---+------+
     |            |
     v            v
+----+------------+----+
|   Shared Components  |
| (MenuCard, OrderCard)|
+----------+-----------+
           |
     +-----+------+
     |            |
     v            v
+----+-----+ +---+------+
| Contexts | | API Layer|
| (Auth,   | | (client, |
|  Cart)   | |  hooks)  |
+----------+ +---+------+
                  |
                  v
          +-------+-------+
          | FastAPI Server |
          | (REST + SSE)  |
          +---------------+
```

---

## 4. 통신 패턴

### 4.1 클라이언트 → 서버
- **프로토콜**: HTTP/HTTPS (REST API)
- **포맷**: JSON
- **인증**: Authorization: Bearer {JWT}
- **타임아웃**: 10초 (모든 API 호출)

### 4.2 서버 → 클라이언트 (실시간)
- **프로토콜**: SSE (Server-Sent Events)
- **연결**: GET /api/sse/orders?store_id={id}
- **이벤트 타입**:
  - `order_created` — 신규 주문
  - `order_updated` — 주문 상태 변경
  - `order_deleted` — 주문 삭제
  - `session_ended` — 테이블 이용 완료

### 4.3 서비스 간 (백엔드 내부)
- **패턴**: 직접 메서드 호출 (동일 프로세스)
- **의존성 주입**: FastAPI Depends()
- **트랜잭션**: SQLAlchemy Session 단위

---

## 5. 데이터 플로우

### 5.1 고객 주문 플로우
```
태블릿 → [메뉴 조회] → API → MenuService → DB
태블릿 → [장바구니] → localStorage (클라이언트 로컬)
태블릿 → [주문 확정] → API → OrderService → DB + SSE 브로드캐스트
관리자 ← [SSE 이벤트] ← SSEManager ← OrderService
```

### 5.2 관리자 모니터링 플로우
```
관리자 → [SSE 연결] → SSEManager (구독 등록)
관리자 ← [실시간 이벤트] ← SSEManager
관리자 → [상태 변경] → API → OrderService → DB + SSE 브로드캐스트
태블릿 ← [주문 상태 업데이트] ← (주문내역 재조회 또는 SSE)
```

---
