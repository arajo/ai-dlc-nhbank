# NFR Requirements - Unit 1: Backend API

---

## 1. 성능 요구사항

| ID | 요구사항 | 목표값 | 측정 방법 |
|----|----------|--------|-----------|
| NFR-PERF-01 | API 응답 시간 | < 500ms (p95) | 요청-응답 시간 측정 |
| NFR-PERF-02 | SSE 이벤트 전달 | < 2초 | 주문 생성 → 클라이언트 수신 시간 |
| NFR-PERF-03 | 동시 접속 | 10명 이하 지원 | SSE 연결 + API 호출 동시 처리 |
| NFR-PERF-04 | DB 쿼리 | < 100ms (단순 CRUD) | SQLAlchemy 쿼리 시간 |

---

## 2. 가용성 요구사항

| ID | 요구사항 | 목표값 | 비고 |
|----|----------|--------|------|
| NFR-AVAIL-01 | 서비스 가동률 | 영업시간 내 99% | 단일 서버, 로컬 |
| NFR-AVAIL-02 | 헬스체크 | Shallow + Deep | /health, /health/deep |
| NFR-AVAIL-03 | 데이터 보존 | 서비스 재시작 시 보존 | SQLite 파일 기반 |
| NFR-AVAIL-04 | 복구 목표 | RTO: N/A, RPO: N/A | 단일 리전, 로컬 백업 |

---

## 3. 회복성 요구사항 (Resiliency Extension)

| ID | RESILIENCY 규칙 | 적용 내용 |
|----|----------------|-----------|
| NFR-RES-01 | RESILIENCY-01 | 워크로드 분류: Medium (단일 매장, 매출 직접 영향) |
| NFR-RES-02 | RESILIENCY-02 | SLA: 99% 영업시간 내. RTO/RPO: N/A (단일 서버) |
| NFR-RES-03 | RESILIENCY-03 | 경량 변경 관리 프로세스 (변경 기록 + 승인 + 롤백 노트) |
| NFR-RES-04 | RESILIENCY-04 | CI/CD: 제안 예정. 배포: Canary. 롤백: Blue/green |
| NFR-RES-05 | RESILIENCY-05 | 구조적 로깅 (JSON), 메트릭 수집 (응답시간, 에러율) |
| NFR-RES-06 | RESILIENCY-06 | 헬스체크: Shallow(/health) + Deep(/health/deep — DB 확인) |
| NFR-RES-07 | RESILIENCY-07 | N/A (단일 서버, 멀티존 아님) |
| NFR-RES-08 | RESILIENCY-08 | N/A (단일 서버 배포, 로컬 개발 우선) |
| NFR-RES-09 | RESILIENCY-09 | N/A (동시 10명 이하, 자동 스케일링 불필요) |
| NFR-RES-10 | RESILIENCY-10 | 타임아웃: DB 5초, 외부 호출 10초. 서킷브레이커: N/A (외부 의존성 없음) |
| NFR-RES-11 | RESILIENCY-11 | DR 전략: 로컬 백업 (SQLite 파일 복사) |
| NFR-RES-12 | RESILIENCY-12 | 자동 백업: 일 1회 SQLite 파일 복사. 보관: 7일 |
| NFR-RES-13 | RESILIENCY-13 | 복구 절차: SQLite 파일 복원 + 서비스 재시작 |
| NFR-RES-14 | RESILIENCY-14 | Operations 단계로 연기 (테스트 시나리오 문서화) |
| NFR-RES-15 | RESILIENCY-15 | 경량 인시던트 대응 + COE 프로세스 제안 |

---

## 4. 테스트 요구사항 (PBT Extension)

| ID | PBT 규칙 | 적용 내용 |
|----|----------|-----------|
| NFR-PBT-01 | PBT-01 | Functional Design에서 속성 식별 완료 (Round-trip, Invariant, Stateful) |
| NFR-PBT-09 | PBT-09 | Python: Hypothesis, TypeScript: fast-check |
| NFR-PBT-10 | PBT-10 | PBT + Example-based 병행 (비즈니스 크리티컬 경로 양쪽 모두 테스트) |

---

## 5. 보안 요구사항 (기본 수준)

| ID | 요구사항 | 구현 |
|----|----------|------|
| NFR-SEC-01 | 비밀번호 해싱 | bcrypt (cost factor 12) |
| NFR-SEC-02 | JWT 서명 | HS256 + 비밀 키 |
| NFR-SEC-03 | 로그인 보호 | 5회 실패 → 5분 잠금 |
| NFR-SEC-04 | 입력 검증 | Pydantic 스키마 (모든 엔드포인트) |
| NFR-SEC-05 | CORS | 허용 출처 제한 (프론트엔드 도메인만) |
| NFR-SEC-06 | SQL 인젝션 방지 | SQLAlchemy ORM (파라미터 바인딩) |

---

## 6. 관측성 (Observability)

| 영역 | 구현 |
|------|------|
| 로깅 | 구조적 JSON 로깅 (Python logging + structlog) |
| 메트릭 | 요청 카운트, 응답 시간, 에러율 (미들웨어 계측) |
| 트레이싱 | N/A (단일 서비스, 분산 아님) |
| 대시보드 | Operations 단계로 연기 |

---

## 7. 유지보수성

| 요구사항 | 구현 |
|----------|------|
| 코드 품질 | Ruff (Python 린터/포매터), ESLint + Prettier (TS) |
| DB 마이그레이션 | Alembic (버전 관리 스키마 변경) |
| API 문서 | FastAPI 자동 OpenAPI/Swagger |
| 테스트 커버리지 | 비즈니스 로직 80%+ 목표 |

---
