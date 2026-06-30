# 🍽️ 테이블오더 서비스

디지털 주문 시스템을 통해 고객에게는 편리한 주문 경험을, 매장 운영자에게는 효율적인 운영 환경을 제공하는 테이블오더 플랫폼입니다.

## 스크린샷

| 고객 메뉴 화면 | 관리자 대시보드 |
|:---:|:---:|
| 다크 테마 + 카테고리 스크롤 + 장바구니 | 테이블별 실시간 주문 모니터링 |

## 주요 기능

### 👤 고객용
- 테이블 자동 로그인 (1회 설정 후 자동)
- 카테고리별 메뉴 탐색 (스크롤 방식)
- 장바구니 관리 (수량 조절, 실시간 합계)
- 주문 생성 + 폭죽 애니메이션 🎉
- 주문 내역 팝업 조회
- 실시간 알림 (주문 상태 변경 시 벨 알림)

### 🏪 관리자용
- 매장 로그인 (16시간 세션, JWT)
- 실시간 주문 대시보드 (테이블별 카드 그리드)
- 주문 상태 변경 (대기중 → 준비중 → 완료)
- 주문 삭제 (직권 수정)
- 테이블 이용 완료 처리 (세션 종료 + 이력 이동)
- 메뉴 CRUD 관리
- 날짜별 전체 주문 이력 조회

## 기술 스택

| 영역 | 기술 |
|------|------|
| 백엔드 | Python 3.11+, FastAPI, SQLAlchemy 2.0, SQLite |
| 프론트엔드 | React 18, TypeScript, Ant Design, Vite |
| 인증 | JWT (python-jose), bcrypt |
| 실시간 | Server-Sent Events (SSE) |
| 테스트 | pytest, Hypothesis (PBT), fast-check |

## 프로젝트 구조

```
table-order/
├── backend/          # FastAPI 백엔드
│   ├── app/
│   │   ├── core/     # 설정, DB, 보안, 미들웨어
│   │   ├── auth/     # 인증 (로그인, JWT)
│   │   ├── menus/    # 메뉴 CRUD
│   │   ├── orders/   # 주문 관리
│   │   ├── tables/   # 테이블 세션 관리
│   │   ├── sse/      # 실시간 이벤트
│   │   └── health/   # 헬스체크
│   └── tests/
├── frontend/         # React 프론트엔드
│   └── src/
│       ├── pages/    # customer/, admin/
│       ├── contexts/ # Auth, Cart
│       ├── api/      # Fetch 래퍼
│       └── hooks/
└── requirements/     # 요구사항 문서
```

## 실행 방법

### 사전 요구사항
- Python 3.11+
- Node.js 18+
- npm

### 백엔드 실행

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt

# 환경변수 설정
cp .env.example .env

# 초기 데이터 생성 (매장, 테이블, 메뉴)
python init_data.py

# 서버 실행
python -m uvicorn app.main:app --reload --port 8000
```

### 프론트엔드 실행

```bash
cd frontend
npm install
npm run dev
```

### 접속

| 페이지 | URL |
|--------|-----|
| 고객용 | http://localhost:5173/customer/login |
| 관리자용 | http://localhost:5173/admin/login |
| API 문서 | http://localhost:8000/docs |
| 헬스체크 | http://localhost:8000/api/health |

### 로그인 정보

| 구분 | 매장 ID | 사용자명/테이블번호 | 비밀번호 |
|------|---------|-------------------|----------|
| 관리자 | `store-001` | `admin` | `1234` |
| 테이블 1 | `store-001` | `1` | `0000` |
| 테이블 2 | `store-001` | `2` | `0000` |
| 테이블 3 | `store-001` | `3` | `0000` |

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

### 주문
- `POST /api/orders` — 주문 생성 (고객)
- `GET /api/orders/session/{session_id}` — 세션별 주문 조회
- `GET /api/orders/active` — 전체 활성 주문 (관리자)
- `PATCH /api/orders/{id}/status` — 상태 변경 (관리자)
- `DELETE /api/orders/{id}` — 주문 삭제 (관리자)
- `GET /api/orders/history/{table_id}` — 과거 이력 (관리자)

### 테이블
- `POST /api/tables` — 테이블 설정 (관리자)
- `GET /api/tables` — 테이블 목록 (관리자)
- `POST /api/tables/{id}/end-session` — 이용 완료 (관리자)

### 실시간
- `GET /api/sse/orders` — 주문 이벤트 스트림 (SSE)

## 설계 문서

상세 설계 문서는 `aidlc-docs/` 폴더에 있습니다:
- 요구사항: `aidlc-docs/inception/requirements/`
- 애플리케이션 설계: `aidlc-docs/inception/application-design/`
- 기능 설계: `aidlc-docs/construction/backend-api/functional-design/`
- NFR 설계: `aidlc-docs/construction/backend-api/nfr-design/`

## 라이선스

MIT
