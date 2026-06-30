# Unit of Work 의존성 매트릭스

---

## 의존성 다이어그램

```
+------------------+
|   Unit 1         |
|  Backend API     |
|  (FastAPI)       |
+--------+---------+
         ^
         | REST API + SSE
    +----+----+
    |         |
+---+---+ +---+---+
| Unit 2| | Unit 3|
| FE    | | FE    |
|Customer| | Admin |
+-------+ +-------+
```

---

## 의존성 매트릭스

| Unit | 의존 대상 | 의존 유형 | 설명 |
|------|-----------|-----------|------|
| Unit 1 (Backend) | — | 없음 | 독립적. 외부 의존성 없음 |
| Unit 2 (FE Customer) | Unit 1 | 런타임 | REST API 호출, SSE 수신 |
| Unit 3 (FE Admin) | Unit 1 | 런타임 | REST API 호출, SSE 수신 |
| Unit 3 (FE Admin) | Unit 2 | 코드 공유 | 공통 모듈 재사용 (api/client, AuthContext, types) |

---

## 구현 순서 및 근거

| 순서 | Unit | 근거 |
|------|------|------|
| 1 | Unit 1 (Backend API) | 모든 프론트엔드의 의존 대상. API가 준비되어야 UI 개발 가능 |
| 2 | Unit 2 (FE Customer) | 핵심 사용자 경험. 공통 모듈(api, contexts, types) 생성 |
| 3 | Unit 3 (FE Admin) | Unit 2의 공통 모듈 재사용. 관리자 전용 기능 추가 |

---

## 통합 포인트

| 포인트 | Unit 간 | 통합 방식 |
|--------|---------|-----------|
| REST API | Unit 1 ↔ Unit 2, 3 | HTTP JSON (Fetch API) |
| SSE 이벤트 | Unit 1 → Unit 2, 3 | EventSource 연결 |
| 인증 토큰 | Unit 1 ↔ Unit 2, 3 | JWT (Authorization Header) |
| 공통 타입 | Unit 2 → Unit 3 | TypeScript 타입 공유 |

---

## 빌드/테스트 독립성

| Unit | 독립 빌드 | 독립 테스트 | 비고 |
|------|-----------|-------------|------|
| Unit 1 | ✅ | ✅ | pytest 단독 실행 가능 |
| Unit 2 | ✅ | ✅ (Mock API) | API Mock으로 독립 테스트 |
| Unit 3 | ✅ | ✅ (Mock API) | API Mock으로 독립 테스트 |

---
