# NFR Design Patterns - Unit 1: Backend API

---

## 1. 회복성 패턴 (Resilience)

### 1.1 타임아웃 패턴 (RESILIENCY-10)
- **DB 쿼리 타임아웃**: 5초 (SQLAlchemy 연결 풀 설정)
- **SSE 연결 타임아웃**: 클라이언트 60초 비활동 시 연결 종료
- **구현**: SQLAlchemy `pool_timeout=5`, FastAPI background task로 유휴 연결 정리

### 1.2 그레이스풀 디그레이데이션
- **DB 연결 실패 시**: 헬스체크 deep 실패 응답, 기존 SSE 연결 유지
- **SSE 연결 폭주 시**: 최대 동시 연결 수 제한 (20개)
- **구현**: SSEManager에서 연결 수 카운트, 초과 시 503 반환

### 1.3 헬스체크 패턴 (RESILIENCY-06)
```
GET /api/health         → { "status": "ok", "timestamp": "..." }
GET /api/health/deep    → { "status": "ok", "database": "connected", "timestamp": "..." }
```
- Shallow: 프로세스 생존 확인 (항상 200)
- Deep: DB 연결 확인 (`SELECT 1` 실행)

### 1.4 데이터 백업 패턴 (RESILIENCY-12)
- **자동 백업**: 일 1회 SQLite 파일 복사 (`table_order.db` → `backups/table_order_YYYYMMDD.db`)
- **보관 정책**: 7일간 보관, 이후 자동 삭제
- **구현**: FastAPI startup event 또는 별도 스케줄러 스크립트

---

## 2. 성능 패턴 (Performance)

### 2.1 비동기 처리
- **모든 API 핸들러**: `async def` (비동기)
- **DB 접근**: `aiosqlite` 비동기 드라이버
- **SSE**: `asyncio.Queue` 기반 이벤트 전달
- **이점**: I/O 바운드 작업 동시 처리 (동시 10명 충분)

### 2.2 연결 풀링
- SQLAlchemy 연결 풀 설정:
  - `pool_size`: 5 (동시 10명 기준 충분)
  - `max_overflow`: 5
  - `pool_timeout`: 5초
  - `pool_recycle`: 3600초 (1시간)

### 2.3 SSE 효율화
- 인메모리 큐 기반 (외부 메시지 브로커 불필요)
- 매장 단위 이벤트 라우팅 (불필요한 브로드캐스트 방지)
- 30초 간격 하트비트 (연결 유지)

---

## 3. 보안 패턴 (Security)

### 3.1 인증 미들웨어
```
Request → CORS 확인 → JWT 추출 → 토큰 검증 → 권한 확인 → Handler
```
- 공개 엔드포인트: `/api/health`, `/api/auth/*`
- 테이블 인증: `/api/menus` (GET), `/api/orders` (POST/GET)
- 관리자 인증: `/api/menus` (POST/PUT/DELETE), `/api/orders` (PATCH/DELETE), `/api/tables/*`

### 3.2 요청 검증 체인
```
Raw Input → Pydantic Schema → Business Validation → DB Operation
```
- Layer 1: Pydantic (타입, 형식, 범위)
- Layer 2: 비즈니스 규칙 (존재 확인, 권한, 상태)
- Layer 3: DB 제약 조건 (UNIQUE, FK)

### 3.3 에러 정보 최소화
- 프로덕션: 상세 에러 메시지 숨김 (generic message)
- 개발: 상세 스택트레이스 표시 (DEBUG 모드)

---

## 4. 관측성 패턴 (Observability) (RESILIENCY-05)

### 4.1 구조적 로깅
```json
{
  "timestamp": "2026-06-30T12:00:00Z",
  "level": "INFO",
  "event": "order_created",
  "store_id": "store-001",
  "table_id": 3,
  "order_number": "20260630-001",
  "total_amount": 25000,
  "request_id": "uuid-..."
}
```

### 4.2 미들웨어 계측
- **요청 ID**: 모든 요청에 UUID 부여 (X-Request-ID 헤더)
- **응답 시간**: 미들웨어에서 시작/종료 시간 측정, 로그 기록
- **에러율**: HTTP 5xx 응답 카운트

### 4.3 SSE 연결 모니터링
- 활성 연결 수 로깅 (연결/해제 시)
- 이벤트 전달 실패 로깅

---

## 5. 변경 관리 패턴 (RESILIENCY-03)

### 5.1 경량 변경 관리 프로세스
```
1. 변경 기록 작성 (무엇을, 왜, 영향 범위)
2. 코드 리뷰 / 승인
3. 테스트 실행 확인
4. 롤백 노트 작성 (실패 시 복구 절차)
5. 배포 실행
```

### 5.2 DB 마이그레이션 관리
- Alembic으로 모든 스키마 변경 버전 관리
- 마이그레이션 파일에 롤백(downgrade) 항상 작성
- 배포 전 마이그레이션 테스트 (dev DB에서)

---

## 6. 인시던트 대응 패턴 (RESILIENCY-15)

### 6.1 경량 인시던트 대응 프로세스
```
1. 감지: 헬스체크 실패 또는 에러율 급증
2. 대응: 서비스 재시작 시도
3. 에스컬레이션: 재시작 실패 시 DB 백업 확인 → 복원
4. 사후분석: 원인 분석, 재발 방지 조치 문서화
```

### 6.2 COE (Correction of Errors) 템플릿
```markdown
## 인시던트 보고
- 발생 시각:
- 감지 시각:
- 해결 시각:
- 영향 범위:
- 근본 원인:
- 해결 방법:
- 재발 방지 조치:
```

---
