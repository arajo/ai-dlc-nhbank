# 컴포넌트 정의서

## 1. 백엔드 컴포넌트 (FastAPI)

### 1.1 Auth 도메인
| 컴포넌트 | 책임 |
|----------|------|
| `auth/router` | 인증 관련 API 엔드포인트 (로그인, 테이블 로그인) |
| `auth/service` | 인증 비즈니스 로직 (토큰 생성/검증, 비밀번호 검증) |
| `auth/models` | Admin, TableSession 데이터 모델 |
| `auth/schemas` | Pydantic 요청/응답 스키마 |

### 1.2 Menu 도메인
| 컴포넌트 | 책임 |
|----------|------|
| `menus/router` | 메뉴 CRUD API 엔드포인트 |
| `menus/service` | 메뉴 비즈니스 로직 (카테고리 관리, 순서 조정) |
| `menus/models` | Category, MenuItem 데이터 모델 |
| `menus/schemas` | Pydantic 요청/응답 스키마 |

### 1.3 Orders 도메인
| 컴포넌트 | 책임 |
|----------|------|
| `orders/router` | 주문 생성/조회/상태변경 API 엔드포인트 |
| `orders/service` | 주문 비즈니스 로직 (생성, 상태 관리, 삭제) |
| `orders/models` | Order, OrderItem, OrderHistory 데이터 모델 |
| `orders/schemas` | Pydantic 요청/응답 스키마 |

### 1.4 Tables 도메인
| 컴포넌트 | 책임 |
|----------|------|
| `tables/router` | 테이블 관리 API 엔드포인트 |
| `tables/service` | 테이블 세션 관리 (시작/종료, 이용완료) |
| `tables/models` | Table, TableSession 데이터 모델 |
| `tables/schemas` | Pydantic 요청/응답 스키마 |

### 1.5 공통 계층
| 컴포넌트 | 책임 |
|----------|------|
| `core/config` | 앱 설정 (환경변수, 상수) |
| `core/database` | SQLAlchemy 엔진, 세션 관리 |
| `core/security` | JWT 토큰 유틸리티, bcrypt 해싱 |
| `core/dependencies` | FastAPI 의존성 주입 (인증 확인 등) |
| `core/exceptions` | 커스텀 예외 및 에러 핸들러 |
| `sse/manager` | SSE 연결 관리, 이벤트 브로드캐스트 |
| `health/router` | 헬스체크 엔드포인트 (/health, /health/deep) |

---

## 2. 프론트엔드 컴포넌트 (React + Ant Design)

### 2.1 고객용 페이지 (Customer)
| 컴포넌트 | 책임 |
|----------|------|
| `pages/customer/MenuPage` | 메뉴 조회 및 탐색 (기본 화면) |
| `pages/customer/CartPage` | 장바구니 관리 |
| `pages/customer/OrderConfirmPage` | 주문 확인 및 확정 |
| `pages/customer/OrderHistoryPage` | 주문 내역 조회 |
| `pages/customer/LoginPage` | 테이블 초기 설정 (1회) |

### 2.2 관리자용 페이지 (Admin)
| 컴포넌트 | 책임 |
|----------|------|
| `pages/admin/LoginPage` | 관리자 로그인 |
| `pages/admin/DashboardPage` | 실시간 주문 모니터링 (그리드) |
| `pages/admin/MenuManagePage` | 메뉴 CRUD 관리 |
| `pages/admin/TableDetailPage` | 테이블 상세 (주문 삭제, 이용완료, 과거내역) |

### 2.3 공통 컴포넌트
| 컴포넌트 | 책임 |
|----------|------|
| `components/MenuCard` | 메뉴 카드 UI (이미지, 이름, 가격) |
| `components/CartDrawer` | 장바구니 드로어/패널 |
| `components/OrderCard` | 주문 카드 (대시보드용) |
| `components/CategoryNav` | 카테고리 네비게이션 |
| `components/Layout` | 공통 레이아웃 (헤더, 네비게이션) |

### 2.4 상태 관리 (Context)
| 컴포넌트 | 책임 |
|----------|------|
| `contexts/AuthContext` | 인증 상태 (토큰, 테이블 정보) |
| `contexts/CartContext` | 장바구니 상태 (아이템, 수량, 합계) |

### 2.5 API 통신 레이어
| 컴포넌트 | 책임 |
|----------|------|
| `api/client` | Fetch API 래퍼 (baseURL, 인터셉터, 에러처리) |
| `api/auth` | 인증 관련 API 호출 |
| `api/menus` | 메뉴 관련 API 호출 |
| `api/orders` | 주문 관련 API 호출 |
| `api/tables` | 테이블 관련 API 호출 |
| `hooks/useSSE` | SSE 연결 커스텀 훅 |

---
