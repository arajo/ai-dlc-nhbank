# 컴포넌트 메서드 시그니처

> **Note**: 상세 비즈니스 규칙은 Functional Design (CONSTRUCTION) 단계에서 정의됩니다.

---

## 1. 백엔드 서비스 메서드

### 1.1 AuthService

| 메서드 | 입력 | 출력 | 목적 |
|--------|------|------|------|
| `login_admin(store_id, username, password)` | str, str, str | `TokenResponse` | 관리자 로그인, JWT 발급 |
| `login_table(store_id, table_number, password)` | str, int, str | `TableTokenResponse` | 테이블 로그인, 세션 토큰 발급 |
| `verify_token(token)` | str | `TokenPayload` | JWT 토큰 검증 |
| `hash_password(password)` | str | str | bcrypt 해싱 |
| `verify_password(plain, hashed)` | str, str | bool | 비밀번호 검증 |

### 1.2 MenuService

| 메서드 | 입력 | 출력 | 목적 |
|--------|------|------|------|
| `get_categories(store_id)` | str | `list[Category]` | 카테고리 목록 조회 |
| `get_menus_by_category(store_id, category_id)` | str, int | `list[MenuItem]` | 카테고리별 메뉴 조회 |
| `get_all_menus(store_id)` | str | `list[MenuItem]` | 전체 메뉴 조회 |
| `create_menu(store_id, menu_data)` | str, `MenuCreate` | `MenuItem` | 메뉴 등록 |
| `update_menu(menu_id, menu_data)` | int, `MenuUpdate` | `MenuItem` | 메뉴 수정 |
| `delete_menu(menu_id)` | int | None | 메뉴 삭제 |
| `update_menu_order(store_id, order_data)` | str, `list[MenuOrder]` | None | 메뉴 노출 순서 변경 |

### 1.3 OrderService

| 메서드 | 입력 | 출력 | 목적 |
|--------|------|------|------|
| `create_order(store_id, table_id, session_id, items)` | str, int, str, `list[OrderItemCreate]` | `Order` | 주문 생성 |
| `get_orders_by_session(session_id)` | str | `list[Order]` | 세션별 주문 조회 |
| `get_orders_by_table(store_id, table_id)` | str, int | `list[Order]` | 테이블별 현재 주문 조회 |
| `get_all_active_orders(store_id)` | str | `list[Order]` | 매장 전체 활성 주문 조회 |
| `update_order_status(order_id, status)` | int, `OrderStatus` | `Order` | 주문 상태 변경 |
| `delete_order(order_id)` | int | None | 주문 삭제 (관리자 직권) |
| `get_order_history(store_id, table_id, date_filter)` | str, int, `DateFilter` | `list[OrderHistory]` | 과거 주문 이력 조회 |

### 1.4 TableService

| 메서드 | 입력 | 출력 | 목적 |
|--------|------|------|------|
| `setup_table(store_id, table_number, password)` | str, int, str | `Table` | 테이블 초기 설정 |
| `get_tables(store_id)` | str | `list[Table]` | 매장 테이블 목록 조회 |
| `start_session(store_id, table_id)` | str, int | `TableSession` | 테이블 세션 시작 |
| `end_session(store_id, table_id, session_id)` | str, int, str | None | 테이블 이용 완료 처리 |
| `get_table_summary(store_id, table_id)` | str, int | `TableSummary` | 테이블 현재 상태 요약 (총주문액 등) |

### 1.5 SSEManager

| 메서드 | 입력 | 출력 | 목적 |
|--------|------|------|------|
| `connect(store_id, client_id)` | str, str | `AsyncGenerator` | SSE 연결 생성 |
| `disconnect(client_id)` | str | None | SSE 연결 해제 |
| `broadcast(store_id, event_type, data)` | str, str, dict | None | 매장 전체에 이벤트 브로드캐스트 |
| `send_to_table(store_id, table_id, event_type, data)` | str, int, str, dict | None | 특정 테이블에 이벤트 전송 |

---

## 2. 프론트엔드 커스텀 훅

### 2.1 API 훅

| 훅 | 반환값 | 목적 |
|----|--------|------|
| `useMenus(categoryId?)` | `{ menus, loading, error }` | 메뉴 조회 |
| `useCategories()` | `{ categories, loading, error }` | 카테고리 조회 |
| `useOrders(sessionId)` | `{ orders, loading, error }` | 주문 내역 조회 |
| `useCreateOrder()` | `{ createOrder, loading, error }` | 주문 생성 |
| `useSSE(storeId)` | `{ events, connected }` | SSE 실시간 이벤트 수신 |

### 2.2 Context 훅

| 훅 | 반환값 | 목적 |
|----|--------|------|
| `useAuth()` | `{ token, tableInfo, login, logout, isAuthenticated }` | 인증 상태 관리 |
| `useCart()` | `{ items, addItem, removeItem, updateQuantity, clear, total }` | 장바구니 상태 관리 |

---
