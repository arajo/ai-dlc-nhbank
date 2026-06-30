# 비즈니스 로직 모델 - Unit 1: Backend API

---

## 1. 인증 플로우

### 1.1 관리자 로그인
```
입력: store_id, username, password
처리:
  1. LoginAttempt 확인 → 잠금 상태면 에러 반환 (5분 미경과)
  2. Store 조회 (store_id + username)
  3. 비밀번호 검증 (bcrypt)
  4. 실패 시: attempt_count 증가, 5회 도달 시 locked_until 설정
  5. 성공 시: attempt_count 리셋, JWT 생성 (16시간 만료)
출력: { access_token, token_type, expires_in }
```

### 1.2 테이블 로그인
```
입력: store_id, table_number, password
처리:
  1. Table 조회 (store_id + table_number)
  2. 비밀번호 검증 (bcrypt)
  3. 성공 시: JWT 생성 (16시간 만료, payload에 table_id + store_id 포함)
출력: { access_token, token_type, table_id, store_id, table_number }
```

### 1.3 JWT 페이로드 구조
```json
{
  "sub": "store_id",
  "type": "admin" | "table",
  "table_id": 1,        // table 타입만
  "table_number": 3,    // table 타입만
  "exp": 1719792000,
  "iat": 1719734400
}
```

---

## 2. 주문 플로우

### 2.1 주문 생성
```
입력: store_id, table_id, session_id, items[{menu_id, quantity}]
처리:
  1. 테이블 세션 확인 (활성 세션 존재 여부)
  2. 활성 세션 없으면 → 새 세션 자동 생성 (첫 주문 = 세션 시작)
  3. 각 item에 대해 MenuItem 조회 → menu_name, unit_price 스냅샷
  4. total_amount 계산 (sum of quantity * unit_price)
  5. OrderCounter에서 당일 순번 증가 → 주문번호 생성 (YYYYMMDD-NNN)
  6. Order + OrderItems 저장 (트랜잭션)
  7. SSE 브로드캐스트: order_created 이벤트
출력: { order_id, order_number, total_amount, status, items, created_at }
```

### 2.2 주문 상태 변경
```
입력: order_id, new_status
처리:
  1. Order 조회
  2. 상태 변경 (유연한 전이 — 모든 전환 허용)
  3. updated_at 갱신
  4. SSE 브로드캐스트: order_updated 이벤트
출력: { order_id, status, updated_at }
```

### 2.3 주문 삭제 (관리자 직권)
```
입력: order_id
처리:
  1. Order 조회 (존재 확인)
  2. Order + OrderItems 삭제
  3. SSE 브로드캐스트: order_deleted 이벤트
출력: { success: true }
```

---

## 3. 테이블 세션 플로우

### 3.1 세션 자동 시작
```
트리거: 테이블의 첫 주문 생성 시 (활성 세션 없을 때)
처리:
  1. TableSession 생성 (UUID, started_at = now, is_active = true)
  2. Table.current_session_id 업데이트
출력: 새 session_id 반환 (주문에 연결)
```

### 3.2 테이블 이용 완료 (세션 종료)
```
입력: store_id, table_id
처리:
  1. 활성 세션 조회
  2. 해당 세션의 모든 Order 조회
  3. 각 Order를 OrderHistory로 변환 (items → JSON 직렬화)
  4. 모든 Order + OrderItems 삭제
  5. TableSession.ended_at = now, is_active = false
  6. Table.current_session_id = null
  7. SSE 브로드캐스트: session_ended 이벤트
출력: { success: true, orders_archived: count }
```

---

## 4. 메뉴 관리 플로우

### 4.1 메뉴 등록
```
입력: store_id, category_id, name, price, description?, image_url?
처리:
  1. Category 존재 확인
  2. 가격 검증 (>= 0)
  3. 필수 필드 검증 (name, price, category_id)
  4. sort_order 결정 (카테고리 내 마지막 + 1)
  5. MenuItem 생성
출력: MenuItem 객체
```

### 4.2 메뉴 순서 변경
```
입력: store_id, items[{menu_id, sort_order}]
처리:
  1. 모든 menu_id가 해당 store 소속인지 검증
  2. 각 MenuItem.sort_order 일괄 업데이트
출력: { success: true }
```

---

## 5. SSE 이벤트 모델

### 이벤트 타입 및 페이로드
```
order_created:
  { order_id, order_number, table_id, table_number, items, total_amount, status, created_at }

order_updated:
  { order_id, order_number, table_id, status, updated_at }

order_deleted:
  { order_id, order_number, table_id }

session_ended:
  { table_id, table_number, session_id, orders_archived }
```

### 연결 관리
- 매장 단위 구독 (store_id로 구분)
- 클라이언트 연결 시 고유 ID 부여
- 연결 끊김 시 자동 정리
- 하트비트: 30초 간격 ping 이벤트

---

## 6. 주문번호 생성 알고리즘

```python
def generate_order_number(store_id: str, date: date) -> str:
    """
    형식: YYYYMMDD-NNN (예: 20260630-001)
    1. OrderCounter에서 (store_id, date) 조회
    2. 없으면 생성 (counter=0)
    3. counter += 1
    4. 저장
    5. 반환: f"{date.strftime('%Y%m%d')}-{counter:03d}"
    """
```

---

## 7. 데이터 정리 (30일 보관)

### 과거 이력 자동 삭제
```
주기: 일 1회 (서버 시작 시 또는 스케줄러)
처리:
  1. OrderHistory에서 completed_at < (now - 30일) 조건 조회
  2. 해당 레코드 삭제
  3. 정리 로그 기록
```

---
