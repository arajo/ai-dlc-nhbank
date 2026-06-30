# Code Generation Plan - Unit 1: Backend API

## Unit Context
- **Unit**: Backend API (FastAPI + SQLAlchemy + SQLite)
- **위치**: `backend/` (워크스페이스 루트)
- **요구사항**: FR-C01~C05, FR-A01~A04, NFR-01~04, RES-*, TEST-*
- **의존성**: 없음 (독립 단위)

---

## 코드 생성 단계

### Phase A: 프로젝트 구조 셋업
- [ ] Step 1: 프로젝트 디렉토리 구조 생성 + requirements.txt + requirements-dev.txt
- [ ] Step 2: `app/core/config.py` — 설정 관리 (pydantic-settings)
- [ ] Step 3: `app/core/database.py` — SQLAlchemy 비동기 엔진, 세션 팩토리
- [ ] Step 4: `app/core/security.py` — JWT 유틸리티, bcrypt 해싱
- [ ] Step 5: `app/core/exceptions.py` — 커스텀 예외 계층 + 글로벌 핸들러

### Phase B: 도메인 모델 + 마이그레이션
- [ ] Step 6: `app/auth/models.py` — Store, LoginAttempt 모델
- [ ] Step 7: `app/tables/models.py` — Table, TableSession 모델
- [ ] Step 8: `app/menus/models.py` — Category, MenuItem 모델
- [ ] Step 9: `app/orders/models.py` — Order, OrderItem, OrderHistory, OrderCounter 모델
- [ ] Step 10: Alembic 초기 설정 + 초기 마이그레이션 스크립트

### Phase C: 서비스 레이어 (비즈니스 로직)
- [ ] Step 11: `app/auth/service.py` — AuthService (로그인, JWT, 잠금)
- [ ] Step 12: `app/auth/schemas.py` — Pydantic 스키마 (요청/응답)
- [ ] Step 13: `app/menus/service.py` — MenuService (CRUD, 순서)
- [ ] Step 14: `app/menus/schemas.py` — Pydantic 스키마
- [ ] Step 15: `app/orders/service.py` — OrderService (생성, 상태, 삭제, 이력)
- [ ] Step 16: `app/orders/schemas.py` — Pydantic 스키마
- [ ] Step 17: `app/tables/service.py` — TableService (설정, 세션, 이용완료)
- [ ] Step 18: `app/tables/schemas.py` — Pydantic 스키마

### Phase D: SSE + 미들웨어 + 헬스체크
- [ ] Step 19: `app/sse/manager.py` — SSEManager (연결풀, 큐, 하트비트, 라우팅)
- [ ] Step 20: `app/sse/router.py` — SSE 엔드포인트
- [ ] Step 21: `app/core/dependencies.py` — FastAPI 의존성 (인증, DB 세션)
- [ ] Step 22: `app/core/middleware.py` — RequestID, Logging, Timing 미들웨어
- [ ] Step 23: `app/health/router.py` — 헬스체크 (Shallow + Deep)

### Phase E: API 라우터
- [ ] Step 24: `app/auth/router.py` — 인증 엔드포인트 (admin login, table login)
- [ ] Step 25: `app/menus/router.py` — 메뉴 엔드포인트 (CRUD + 순서)
- [ ] Step 26: `app/orders/router.py` — 주문 엔드포인트 (생성, 조회, 상태, 삭제, 이력)
- [ ] Step 27: `app/tables/router.py` — 테이블 엔드포인트 (설정, 목록, 이용완료, 요약)
- [ ] Step 28: `app/main.py` — FastAPI 앱 생성, 라우터 등록, 미들웨어, lifespan

### Phase F: 테스트
- [ ] Step 29: `tests/conftest.py` — 테스트 픽스처 (TestClient, 테스트 DB, 팩토리)
- [ ] Step 30: `tests/test_auth/` — 인증 테스트 (example-based + PBT)
- [ ] Step 31: `tests/test_menus/` — 메뉴 테스트 (example-based + PBT)
- [ ] Step 32: `tests/test_orders/` — 주문 테스트 (example-based + PBT)
- [ ] Step 33: `tests/test_tables/` — 테이블 테스트 (example-based + PBT)
- [ ] Step 34: `tests/pbt/generators.py` — 도메인 제너레이터 (Hypothesis strategies)
- [ ] Step 35: `tests/pbt/test_properties.py` — PBT 속성 테스트 (Round-trip, Invariant, Stateful)

### Phase G: 문서 + 배포
- [ ] Step 36: `README.md` — 프로젝트 설명, 설치/실행 가이드
- [ ] Step 37: `.env.example` — 환경변수 템플릿
- [ ] Step 38: 코드 생성 요약 문서 (`aidlc-docs/construction/backend-api/code/code-summary.md`)

---

## Story Traceability

| Step 범위 | 구현되는 요구사항 |
|-----------|------------------|
| Steps 1-5 | 기반 인프라 (NFR) |
| Steps 6-10 | 데이터 모델 (전체) |
| Steps 11-12 | FR-C01, FR-A01 (인증) |
| Steps 13-14 | FR-C02, FR-A04 (메뉴) |
| Steps 15-16 | FR-C03, FR-C04, FR-C05, FR-A02 (주문) |
| Steps 17-18 | FR-A03 (테이블 관리) |
| Steps 19-23 | NFR-01, NFR-04, RESILIENCY-05/06/10 |
| Steps 24-28 | API 통합 (전체 FR) |
| Steps 29-35 | TEST-01 (PBT), NFR 테스트 |
| Steps 36-38 | 문서화 |

---

## 총 38개 스텝 | 예상 범위: 약 40-50개 파일 생성
