# Unit of Work 정의서

---

## 작업 단위 개요

| Unit | 이름 | 설명 | 구현 순서 |
|------|------|------|-----------|
| Unit 1 | Backend API | FastAPI 백엔드 전체 (Core, Auth, Menu, Order, Table, SSE, Health) | 1순위 |
| Unit 2 | Frontend Customer | React 고객용 인터페이스 (메뉴, 장바구니, 주문, 내역) | 2순위 |
| Unit 3 | Frontend Admin | React 관리자용 인터페이스 (대시보드, 메뉴관리, 테이블관리) | 3순위 |

---

## Unit 1: Backend API

### 정의
FastAPI 기반 RESTful API 서버. 모든 비즈니스 로직, 데이터 접근, 인증, 실시간 통신(SSE)을 포함.

### 범위
- `backend/` 디렉토리 전체
- Core: 설정, DB, 보안, 의존성, 예외처리
- Auth: 관리자/테이블 인증, JWT
- Menus: 메뉴 CRUD, 카테고리 관리
- Orders: 주문 생성/조회/상태변경/삭제, 이력관리
- Tables: 테이블 설정, 세션 관리, 이용완료
- SSE: 실시간 이벤트 브로드캐스트
- Health: 헬스체크 엔드포인트

### 모듈 구성
```
backend/
+-- app/
|   +-- main.py
|   +-- core/ (config, database, security, dependencies, exceptions)
|   +-- auth/ (router, service, models, schemas)
|   +-- menus/ (router, service, models, schemas)
|   +-- orders/ (router, service, models, schemas)
|   +-- tables/ (router, service, models, schemas)
|   +-- sse/ (manager, router)
|   +-- health/ (router)
+-- tests/
|   +-- conftest.py
|   +-- test_auth/
|   +-- test_menus/
|   +-- test_orders/
|   +-- test_tables/
|   +-- pbt/ (Property-Based Tests)
+-- alembic/
+-- requirements.txt
+-- alembic.ini
```

### 산출물
- 완전한 REST API (모든 엔드포인트)
- SQLAlchemy ORM 모델 + Alembic 마이그레이션
- SSE 이벤트 스트리밍
- JWT 인증 시스템
- 헬스체크 엔드포인트
- 단위 테스트 + PBT (Hypothesis)

---

## Unit 2: Frontend Customer

### 정의
React 기반 고객용 웹 인터페이스. 테이블에서 고객이 메뉴를 탐색하고 주문하는 화면.

### 범위
- `frontend/src/pages/customer/` 페이지 전체
- 고객용 공통 컴포넌트 (MenuCard, CartDrawer, CategoryNav)
- 장바구니 Context (CartContext)
- 인증 Context (AuthContext — 테이블 로그인)
- API 통신 레이어 (client, auth, menus, orders)
- 공통 레이아웃, 타입 정의

### 모듈 구성
```
frontend/src/
+-- pages/customer/ (LoginPage, MenuPage, CartPage, OrderConfirmPage, OrderHistoryPage)
+-- components/ (MenuCard, CartDrawer, CategoryNav, Layout)
+-- contexts/ (AuthContext, CartContext)
+-- api/ (client, auth, menus, orders)
+-- hooks/ (useMenus, useOrders, useSSE)
+-- types/
```

### 산출물
- 고객용 5개 페이지 (로그인, 메뉴, 장바구니, 주문확인, 주문내역)
- 반응형 UI (Ant Design)
- 장바구니 로컬 영속성 (localStorage)
- SSE 주문 상태 수신
- PBT (fast-check — 장바구니 로직 등)

---

## Unit 3: Frontend Admin

### 정의
React 기반 관리자용 웹 인터페이스. 매장 운영자가 실시간으로 주문을 모니터링하고 관리하는 대시보드.

### 범위
- `frontend/src/pages/admin/` 페이지 전체
- 관리자용 컴포넌트 (OrderCard, 테이블 그리드 등)
- API 통신 (tables, orders — 관리자 전용 엔드포인트)
- SSE 실시간 연결 (useSSE 훅 활용)

### 모듈 구성
```
frontend/src/
+-- pages/admin/ (LoginPage, DashboardPage, MenuManagePage, TableDetailPage)
+-- components/ (OrderCard — 관리자 대시보드 전용)
+-- api/ (tables — 관리자 전용)
+-- hooks/ (useSSE — 관리자 모니터링용)
```

### 산출물
- 관리자용 4개 페이지 (로그인, 대시보드, 메뉴관리, 테이블상세)
- 실시간 주문 대시보드 (SSE + 그리드 레이아웃)
- 메뉴 CRUD 관리 화면
- 테이블 세션 관리 (이용완료, 주문삭제, 과거내역)

---

## 코드 조직 전략

### 모노레포 구조
```
table-order/              (워크스페이스 루트)
+-- backend/              (Unit 1)
+-- frontend/             (Unit 2 + Unit 3 공유)
+-- README.md
```

### 프론트엔드 공유 전략
Unit 2와 Unit 3은 동일한 `frontend/` 디렉토리 내에서 라우팅으로 분리:
- `/customer/*` — Unit 2 (고객용)
- `/admin/*` — Unit 3 (관리자용)
- 공통 모듈(api/client, contexts/AuthContext, types)은 Unit 2에서 생성, Unit 3에서 재사용

---
