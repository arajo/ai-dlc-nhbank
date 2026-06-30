# Logical Components - Unit 1: Backend API

---

## 논리적 컴포넌트 아키텍처

```
+---------------------------------------------------------------+
|                    FastAPI Application                         |
+---------------------------------------------------------------+
|                                                               |
|  +------------------+  +------------------+  +--------------+ |
|  | Request Pipeline |  |  SSE Manager     |  | Scheduler    | |
|  |                  |  |                  |  |              | |
|  | - CORS MW       |  | - Connection Pool|  | - Backup Job | |
|  | - RequestID MW  |  | - Event Queue    |  | - Cleanup Job| |
|  | - Logging MW    |  | - Heartbeat      |  |              | |
|  | - Timing MW     |  | - Store Routing  |  +--------------+ |
|  | - Auth MW       |  |                  |                    |
|  +------------------+  +------------------+                    |
|                                                               |
|  +----------------------------------------------------------+ |
|  |                  Service Layer                            | |
|  |  AuthService | MenuService | OrderService | TableService | |
|  +----------------------------------------------------------+ |
|                                                               |
|  +----------------------------------------------------------+ |
|  |                  Data Access Layer                        | |
|  |  SQLAlchemy ORM | Connection Pool | Transaction Manager  | |
|  +----------------------------------------------------------+ |
|                                                               |
+---------------------------------------------------------------+
                              |
                              v
                    +-------------------+
                    |     SQLite DB     |
                    | table_order.db    |
                    +-------------------+
                    +-------------------+
                    |    Backup Dir     |
                    | backups/*.db      |
                    +-------------------+
```

---

## 1. Request Pipeline (미들웨어 체인)

| 순서 | 컴포넌트 | 책임 |
|------|----------|------|
| 1 | CORSMiddleware | CORS 헤더 처리, 허용 출처 검증 |
| 2 | RequestIDMiddleware | X-Request-ID 생성/전파 |
| 3 | LoggingMiddleware | 요청/응답 구조적 로깅 |
| 4 | TimingMiddleware | 응답 시간 측정, 메트릭 기록 |
| 5 | (Route-level) AuthDependency | JWT 검증, 권한 확인 |

### 구현 상세
- **CORSMiddleware**: FastAPI 내장 (`CORSMiddleware` from `starlette`)
- **RequestIDMiddleware**: 커스텀 미들웨어 (UUID4 생성, 로그 컨텍스트 바인딩)
- **LoggingMiddleware**: structlog 바인딩 (method, path, status, duration)
- **TimingMiddleware**: time.perf_counter() 기반 측정
- **AuthDependency**: FastAPI `Depends()` (라우터 레벨)

---

## 2. SSE Manager (실시간 이벤트)

| 컴포넌트 | 책임 |
|----------|------|
| ConnectionPool | 매장별 클라이언트 연결 관리 (dict[store_id → set[client_id]]) |
| EventQueue | 클라이언트별 asyncio.Queue (이벤트 버퍼) |
| Heartbeat | 30초 간격 ping 전송 (연결 유지) |
| StoreRouter | 이벤트를 해당 매장 구독자에게만 라우팅 |

### 연결 제한
- 최대 동시 연결: 20 (매장 전체)
- 연결 초과 시: HTTP 503 반환
- 유휴 연결: 60초 비활동 시 종료

---

## 3. Scheduler (백그라운드 작업)

| 작업 | 주기 | 내용 |
|------|------|------|
| DB 백업 | 일 1회 (서버 시작 시 확인) | SQLite 파일 → backups/ 복사 |
| 이력 정리 | 일 1회 | 30일 이전 OrderHistory 삭제 |
| 카운터 정리 | 일 1회 | 30일 이전 OrderCounter 삭제 |
| 백업 정리 | 일 1회 | 7일 이전 백업 파일 삭제 |

### 구현 방식
- FastAPI `lifespan` 이벤트에서 startup 시 실행
- `asyncio.create_task`로 비동기 백그라운드 실행
- 또는 별도 스크립트 (`python -m app.tasks.cleanup`)

---

## 4. Data Access Layer

| 컴포넌트 | 책임 |
|----------|------|
| AsyncEngine | aiosqlite 비동기 엔진 |
| AsyncSessionLocal | 세션 팩토리 (scoped session) |
| TransactionManager | 트랜잭션 라이프사이클 (commit/rollback) |
| ConnectionPool | pool_size=5, max_overflow=5, timeout=5s |

### 트랜잭션 전략
- **읽기 작업**: 자동 커밋 (SELECT)
- **쓰기 작업**: 명시적 트랜잭션 (주문 생성 = Order + OrderItems 원자적)
- **실패 시**: 자동 롤백 (SQLAlchemy session context manager)

---

## 5. 설정 관리

| 컴포넌트 | 책임 |
|----------|------|
| Settings (pydantic-settings) | 환경변수 로딩, 타입 검증, 기본값 |
| .env 파일 | 로컬 개발용 환경변수 (git-ignored) |

---

## 6. 에러 핸들링 컴포넌트

| 컴포넌트 | 책임 |
|----------|------|
| GlobalExceptionHandler | 예상치 못한 500 에러 캐치, 로깅 |
| BusinessExceptionHandler | 비즈니스 예외 → HTTP 응답 변환 |
| ValidationExceptionHandler | Pydantic 검증 에러 포맷 통일 |

### 예외 계층
```
BaseAppException
  +-- NotFoundException (404)
  +-- ValidationException (422)
  +-- ConflictException (409)
  +-- AuthenticationException (401)
  +-- AccountLockedException (423)
  +-- ServiceUnavailableException (503)
```

---
