# 테이블오더 서비스 - Application Design 통합 문서

---

## 1. 아키텍처 개요

### 1.1 시스템 구성
```
+---------------------------------------------------+
|              Frontend (React + Ant Design)         |
|  +---------------------+ +---------------------+  |
|  |   Customer Pages    | |    Admin Pages      |  |
|  | (메뉴/장바구니/주문)  | | (대시보드/메뉴관리)   |  |
|  +---------------------+ +---------------------+  |
|  +---------------------------------------------+  |
|  |        Shared (Contexts, API, Hooks)        |  |
|  +---------------------------------------------+  |
+---------------------------------------------------+
              |  REST API (JSON)  |  SSE
              v                   v
+---------------------------------------------------+
|              Backend (FastAPI + Python)            |
|  +---------------------------------------------+  |
|  |            API Layer (Routers)               |  |
|  +---------------------------------------------+  |
|  +---------------------------------------------+  |
|  |         Service Layer (Business Logic)       |  |
|  +---------------------------------------------+  |
|  +---------------------------------------------+  |
|  |       Data Access (SQLAlchemy ORM)           |  |
|  +---------------------------------------------+  |
+---------------------------------------------------+
              |
              v
+---------------------------------------------------+
|              Database (SQLite)                     |
+---------------------------------------------------+
```

### 1.2 기술 스택 결정
| 항목 | 선택 | 근거 |
|------|------|------|
| 백엔드 구조 | Hybrid (계층별 + 기능별) | 확장성과 가독성 균형 |
| 프론트엔드 | 단일 React 앱 | 코드 공유, 배포 단순화 |
| 상태 관리 | React Context + useReducer | 외부 의존성 없음, 규모에 적합 |
| API 통신 | Fetch API + 커스텀 훅 | 최소 의존성 |
| ORM | SQLAlchemy (Full ORM) | 관계 매핑, 마이그레이션 지원 |
| JWT 저장 | localStorage | MVP 적합, 구현 단순 |
| UI | Ant Design | 완성도 높은 컴포넌트 세트 |
| 저장소 | 모노레포 | 백엔드+프론트엔드 통합 관리 |

---

## 2. 프로젝트 디렉토리 구조

```
table-order/
+-- backend/
|   +-- app/
|   |   +-- main.py                 # FastAPI 앱 생성, 라우터 등록
|   |   +-- core/
|   |   |   +-- config.py           # 설정 (환경변수, 상수)
|   |   |   +-- database.py         # SQLAlchemy 엔진, 세션
|   |   |   +-- security.py         # JWT, bcrypt 유틸리티
|   |   |   +-- dependencies.py     # FastAPI 의존성 (인증 등)
|   |   |   +-- exceptions.py       # 커스텀 예외, 에러 핸들러
|   |   +-- auth/
|   |   |   +-- router.py
|   |   |   +-- service.py
|   |   |   +-- models.py
|   |   |   +-- schemas.py
|   |   +-- menus/
|   |   |   +-- router.py
|   |   |   +-- service.py
|   |   |   +-- models.py
|   |   |   +-- schemas.py
|   |   +-- orders/
|   |   |   +-- router.py
|   |   |   +-- service.py
|   |   |   +-- models.py
|   |   |   +-- schemas.py
|   |   +-- tables/
|   |   |   +-- router.py
|   |   |   +-- service.py
|   |   |   +-- models.py
|   |   |   +-- schemas.py
|   |   +-- sse/
|   |   |   +-- manager.py
|   |   |   +-- router.py
|   |   +-- health/
|   |       +-- router.py
|   +-- tests/
|   |   +-- conftest.py
|   |   +-- test_auth/
|   |   +-- test_menus/
|   |   +-- test_orders/
|   |   +-- test_tables/
|   |   +-- pbt/                    # Property-Based Tests
|   +-- alembic/                    # DB 마이그레이션
|   +-- requirements.txt
|   +-- alembic.ini
+-- frontend/
|   +-- src/
|   |   +-- App.tsx
|   |   +-- main.tsx
|   |   +-- api/
|   |   |   +-- client.ts           # Fetch 래퍼
|   |   |   +-- auth.ts
|   |   |   +-- menus.ts
|   |   |   +-- orders.ts
|   |   |   +-- tables.ts
|   |   +-- contexts/
|   |   |   +-- AuthContext.tsx
|   |   |   +-- CartContext.tsx
|   |   +-- hooks/
|   |   |   +-- useSSE.ts
|   |   |   +-- useMenus.ts
|   |   |   +-- useOrders.ts
|   |   +-- pages/
|   |   |   +-- customer/
|   |   |   |   +-- MenuPage.tsx
|   |   |   |   +-- CartPage.tsx
|   |   |   |   +-- OrderConfirmPage.tsx
|   |   |   |   +-- OrderHistoryPage.tsx
|   |   |   |   +-- LoginPage.tsx
|   |   |   +-- admin/
|   |   |       +-- LoginPage.tsx
|   |   |       +-- DashboardPage.tsx
|   |   |       +-- MenuManagePage.tsx
|   |   |       +-- TableDetailPage.tsx
|   |   +-- components/
|   |   |   +-- MenuCard.tsx
|   |   |   +-- CartDrawer.tsx
|   |   |   +-- OrderCard.tsx
|   |   |   +-- CategoryNav.tsx
|   |   |   +-- Layout.tsx
|   |   +-- types/
|   |       +-- index.ts            # TypeScript 타입 정의
|   +-- tests/
|   |   +-- pbt/                    # Property-Based Tests (fast-check)
|   +-- package.json
|   +-- vite.config.ts
|   +-- tsconfig.json
+-- README.md
```

---

## 3. API 엔드포인트 설계 (개요)

### 3.1 인증 API
| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/auth/admin/login` | 관리자 로그인 |
| POST | `/api/auth/table/login` | 테이블 로그인 |

### 3.2 메뉴 API
| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/menus` | 전체 메뉴 조회 |
| GET | `/api/menus/categories` | 카테고리 목록 조회 |
| POST | `/api/menus` | 메뉴 등록 (관리자) |
| PUT | `/api/menus/{id}` | 메뉴 수정 (관리자) |
| DELETE | `/api/menus/{id}` | 메뉴 삭제 (관리자) |
| PUT | `/api/menus/order` | 메뉴 순서 변경 (관리자) |

### 3.3 주문 API
| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/orders` | 주문 생성 (고객) |
| GET | `/api/orders/session/{session_id}` | 세션별 주문 조회 |
| GET | `/api/orders/table/{table_id}` | 테이블 현재 주문 조회 |
| GET | `/api/orders/active` | 매장 전체 활성 주문 (관리자) |
| PATCH | `/api/orders/{id}/status` | 주문 상태 변경 (관리자) |
| DELETE | `/api/orders/{id}` | 주문 삭제 (관리자) |
| GET | `/api/orders/history/{table_id}` | 과거 주문 이력 (관리자) |

### 3.4 테이블 API
| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/tables` | 테이블 설정 (관리자) |
| GET | `/api/tables` | 테이블 목록 조회 (관리자) |
| POST | `/api/tables/{id}/end-session` | 이용 완료 처리 (관리자) |
| GET | `/api/tables/{id}/summary` | 테이블 요약 정보 |

### 3.5 SSE API
| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/sse/orders` | 주문 실시간 이벤트 스트림 |

### 3.6 Health API
| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/health` | Shallow 헬스체크 |
| GET | `/api/health/deep` | Deep 헬스체크 (DB 포함) |

---

## 4. 핵심 설계 결정 요약

| 결정 | 선택 | 트레이드오프 |
|------|------|-------------|
| 단일 앱 vs 분리 앱 | 단일 React 앱 | 코드 공유 용이 / 번들 크기 약간 증가 |
| ORM vs Raw SQL | SQLAlchemy ORM | 생산성 높음 / 약간의 성능 오버헤드 |
| 실시간 통신 | SSE (단방향) | 구현 단순 / 양방향 통신 불가 |
| 상태 관리 | Context + useReducer | 의존성 없음 / 대규모 앱에는 부적합 |
| 인증 저장 | localStorage | 단순 / XSS 시 토큰 노출 가능 |

---

## 참고 문서
- [컴포넌트 정의서](components.md)
- [컴포넌트 메서드](component-methods.md)
- [서비스 설계](services.md)
- [의존성 매트릭스](component-dependency.md)

---
