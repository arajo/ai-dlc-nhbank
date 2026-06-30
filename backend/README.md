# Table Order Backend API

테이블오더 서비스 백엔드 API (FastAPI + SQLAlchemy + SQLite)

## 기술 스택

- **Python 3.11+**
- **FastAPI** — 비동기 웹 프레임워크
- **SQLAlchemy 2.0** — ORM (비동기)
- **SQLite** — 경량 데이터베이스
- **JWT** — 인증 (python-jose)
- **bcrypt** — 비밀번호 해싱 (passlib)
- **SSE** — 실시간 주문 알림

## 설치 및 실행

```bash
# 가상환경 생성 및 활성화
python -m venv venv
source venv/bin/activate  # macOS/Linux

# 의존성 설치
pip install -r requirements.txt

# 환경변수 설정
cp .env.example .env
# .env 파일에서 SECRET_KEY를 변경하세요

# 서버 실행
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## API 문서

서버 실행 후 아래 URL에서 자동 생성된 API 문서를 확인할 수 있습니다:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API 엔드포인트

### 인증
- `POST /api/auth/admin/login` — 관리자 로그인
- `POST /api/auth/table/login` — 테이블 로그인

### 메뉴
- `GET /api/menus` — 메뉴 조회
- `GET /api/menus/categories` — 카테고리 조회
- `POST /api/menus` — 메뉴 등록 (관리자)
- `PUT /api/menus/{id}` — 메뉴 수정 (관리자)
- `DELETE /api/menus/{id}` — 메뉴 삭제 (관리자)
- `PUT /api/menus/order` — 순서 변경 (관리자)

### 주문
- `POST /api/orders` — 주문 생성 (고객)
- `GET /api/orders/session/{session_id}` — 세션별 주문 조회
- `GET /api/orders/active` — 전체 활성 주문 (관리자)
- `PATCH /api/orders/{id}/status` — 주문 상태 변경 (관리자)
- `DELETE /api/orders/{id}` — 주문 삭제 (관리자)
- `GET /api/orders/history/{table_id}` — 과거 주문 이력 (관리자)

### 테이블
- `POST /api/tables` — 테이블 설정 (관리자)
- `GET /api/tables` — 테이블 목록 (관리자)
- `GET /api/tables/{id}/summary` — 테이블 요약 (관리자)
- `POST /api/tables/{id}/end-session` — 이용 완료 (관리자)

### 실시간
- `GET /api/sse/orders` — 주문 이벤트 스트림 (SSE)

### 헬스체크
- `GET /api/health` — Shallow 헬스체크
- `GET /api/health/deep` — Deep 헬스체크 (DB 포함)

## 테스트 실행

```bash
# 개발 의존성 설치
pip install -r requirements-dev.txt

# 전체 테스트 실행
pytest

# PBT만 실행
pytest tests/pbt/
```

## 프로젝트 구조

```
backend/
├── app/
│   ├── main.py
│   ├── core/        (config, database, security, dependencies, exceptions, middleware)
│   ├── auth/        (router, service, models, schemas)
│   ├── menus/       (router, service, models, schemas)
│   ├── orders/      (router, service, models, schemas)
│   ├── tables/      (router, service, models, schemas)
│   ├── sse/         (manager, router)
│   └── health/      (router)
├── tests/
│   ├── conftest.py
│   ├── test_auth/
│   ├── test_menus/
│   ├── test_orders/
│   ├── test_tables/
│   └── pbt/         (generators, property tests)
├── requirements.txt
├── requirements-dev.txt
└── .env.example
```
