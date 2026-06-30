# 서비스 레이어 설계

## 서비스 아키텍처 개요

```
┌─────────────────────────────────────────────────────┐
│                   API Layer (Routers)                │
│  auth/router  menus/router  orders/router  tables/  │
├─────────────────────────────────────────────────────┤
│                 Service Layer                        │
│  AuthService  MenuService  OrderService  TableSvc   │
├─────────────────────────────────────────────────────┤
│              Cross-cutting Services                  │
│         SSEManager       HealthService              │
├─────────────────────────────────────────────────────┤
│                 Data Access Layer                    │
│             SQLAlchemy ORM + Models                  │
├─────────────────────────────────────────────────────┤
│                    Database                          │
│                     SQLite                           │
└─────────────────────────────────────────────────────┘
```

---

## 1. 서비스 정의

### 1.1 AuthService
- **책임**: 인증 및 권한 관리
- **의존성**: SQLAlchemy Session, core/security
- **오케스트레이션**:
  - 관리자 로그인: 자격증명 검증 → JWT 생성 → 반환
  - 테이블 로그인: 테이블 자격증명 검증 → 세션 토큰 생성 → 반환

### 1.2 MenuService
- **책임**: 메뉴 데이터 관리
- **의존성**: SQLAlchemy Session
- **오케스트레이션**:
  - 메뉴 CRUD: 검증 → DB 조작 → 반환
  - 순서 변경: 순서값 재계산 → 일괄 업데이트

### 1.3 OrderService
- **책임**: 주문 생명주기 관리
- **의존성**: SQLAlchemy Session, SSEManager
- **오케스트레이션**:
  - 주문 생성: 검증 → DB 저장 → SSE 브로드캐스트(신규 주문 이벤트)
  - 상태 변경: DB 업데이트 → SSE 브로드캐스트(상태 변경 이벤트)
  - 주문 삭제: DB 삭제 → 총액 재계산 → SSE 브로드캐스트
  - 이용 완료: 주문 이력 이동 → 현재 주문 리셋 → SSE 브로드캐스트

### 1.4 TableService
- **책임**: 테이블 설정 및 세션 관리
- **의존성**: SQLAlchemy Session, OrderService
- **오케스트레이션**:
  - 초기 설정: 테이블 생성 → 비밀번호 해싱 → 저장
  - 세션 종료: OrderService에 이용완료 위임 → 세션 상태 업데이트

### 1.5 SSEManager
- **책임**: 실시간 이벤트 브로드캐스트
- **의존성**: 없음 (인메모리 연결 관리)
- **오케스트레이션**:
  - 클라이언트 연결/해제 관리
  - 매장 단위 이벤트 브로드캐스트
  - 테이블 단위 이벤트 전송

### 1.6 HealthService
- **책임**: 서비스 상태 확인
- **의존성**: SQLAlchemy Session
- **오케스트레이션**:
  - Shallow: 프로세스 생존 확인
  - Deep: DB 연결 확인

---

## 2. 서비스 간 상호작용

### 2.1 주문 생성 플로우
```
Client → OrderRouter → OrderService → DB (저장)
                                     → SSEManager (브로드캐스트)
```

### 2.2 테이블 이용완료 플로우
```
Admin → TableRouter → TableService → OrderService (이력 이동)
                                   → DB (세션 종료)
                                   → SSEManager (리셋 이벤트)
```

### 2.3 실시간 모니터링 플로우
```
Admin → SSE 연결 → SSEManager (구독)
                 ← 주문 이벤트 수신 (신규/상태변경/삭제)
```

---

## 3. 에러 처리 전략

| 계층 | 에러 처리 방식 |
|------|----------------|
| Router | HTTPException 변환, 응답 코드 매핑 |
| Service | 비즈니스 예외 발생 (NotFound, Validation, Conflict) |
| Repository | DB 예외 캐치, 서비스 예외로 변환 |
| SSE | 연결 끊김 감지, 자동 정리 |

---
