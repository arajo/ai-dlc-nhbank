# Tech Stack Decisions - Unit 1: Backend API

---

## 핵심 기술 스택

| 영역 | 기술 | 버전 | 근거 |
|------|------|------|------|
| 런타임 | Python | 3.11+ | 비동기 지원, 타입 힌트, 생태계 |
| 웹 프레임워크 | FastAPI | 0.100+ | 비동기, 자동 API 문서, Pydantic 통합 |
| ASGI 서버 | Uvicorn | 0.23+ | FastAPI 표준 서버 |
| ORM | SQLAlchemy | 2.0+ | Full ORM, 관계 매핑, 마이그레이션 |
| 마이그레이션 | Alembic | 1.12+ | SQLAlchemy 통합, 버전 관리 |
| DB | SQLite | 내장 | 경량, 파일 기반, 로컬 개발 최적 |
| 비동기 SQLite | aiosqlite | 0.19+ | SQLAlchemy async 엔진 지원 |
| 인증 | python-jose | 3.3+ | JWT 생성/검증 (HS256) |
| 해싱 | passlib[bcrypt] | 1.7+ | bcrypt 비밀번호 해싱 |
| 검증 | Pydantic | 2.0+ | 요청/응답 스키마 검증 |
| 로깅 | structlog | 23.0+ | 구조적 JSON 로깅 |
| 테스트 | pytest | 7.0+ | Python 표준 테스트 프레임워크 |
| PBT | hypothesis | 6.80+ | 속성 기반 테스팅 (PBT-09) |
| 테스트 비동기 | pytest-asyncio | 0.21+ | 비동기 테스트 지원 |
| HTTP 테스트 | httpx | 0.24+ | FastAPI TestClient 비동기 |
| 린터 | ruff | 0.1+ | 빠른 Python 린터/포매터 |

---

## 의존성 그룹

### 프로덕션 의존성 (requirements.txt)
```
fastapi==0.104.1
uvicorn[standard]==0.24.0
sqlalchemy==2.0.23
alembic==1.13.0
aiosqlite==0.19.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
pydantic==2.5.2
pydantic-settings==2.1.0
structlog==23.2.0
```

### 개발 의존성 (requirements-dev.txt)
```
pytest==7.4.3
pytest-asyncio==0.23.2
httpx==0.25.2
hypothesis==6.92.1
ruff==0.1.8
```

---

## 설정 관리

| 설정 | 방식 | 기본값 |
|------|------|--------|
| DB 경로 | 환경변수 `DATABASE_URL` | `sqlite+aiosqlite:///./table_order.db` |
| JWT 비밀키 | 환경변수 `SECRET_KEY` | (필수, 기본값 없음) |
| JWT 만료 | 환경변수 `JWT_EXPIRE_HOURS` | `16` |
| CORS 출처 | 환경변수 `CORS_ORIGINS` | `http://localhost:5173` |
| 서버 포트 | 환경변수 `PORT` | `8000` |
| 로그 레벨 | 환경변수 `LOG_LEVEL` | `INFO` |

---

## PBT 프레임워크 설정 (PBT-09 준수)

| 항목 | 설정 |
|------|------|
| 프레임워크 | Hypothesis (Python) |
| 테스트 러너 통합 | pytest (hypothesis pytest plugin 자동) |
| 커스텀 제너레이터 | 지원 (st.composite, st.builds) |
| 자동 축소 | 지원 (기본 활성) |
| 시드 재현성 | 지원 (--hypothesis-seed, @settings(database=...)) |
| CI 통합 | pytest 실행 시 자동 포함 |

---

## 결정 근거 요약

| 결정 | 대안 고려 | 선택 이유 |
|------|-----------|-----------|
| SQLAlchemy 2.0 | Tortoise ORM | 사용자 선택. 생태계 성숙도, Alembic 통합 |
| aiosqlite | 동기 sqlite3 | FastAPI 비동기 모델과 호환 |
| structlog | 표준 logging | 구조적 JSON 출력, 회복성 요구사항 충족 |
| Hypothesis | N/A | PBT 확장 필수. Python 최고 PBT 프레임워크 |
| Ruff | Black + isort + flake8 | 단일 도구로 모든 기능, 10~100x 빠름 |
| python-jose | PyJWT | JWS/JWE 모두 지원, 암호화 옵션 다양 |

---
