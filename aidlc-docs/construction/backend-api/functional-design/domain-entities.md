# 도메인 엔티티 설계 - Unit 1: Backend API

---

## 엔티티 관계도 (ERD 텍스트)

```
+----------+       +----------+       +-----------+
|  Store   |1-----*|  Table   |1-----*|  Order    |
+----------+       +----------+       +-----------+
| id (PK)  |       | id (PK)  |       | id (PK)   |
| name     |       | store_id |       | order_num |
| username |       | number   |       | table_id  |
| password |       | password |       | session_id|
+----------+       | session_id       | status    |
      |            | is_active |       | total     |
      |            +----------+       | created_at|
      |                               +-----------+
      |                                     |
      |1                                    |1
      |                                     |
      |*                                    |*
+----------+                          +-----------+
| Category |1-----*+-----------+      | OrderItem |
+----------+       | MenuItem  |      +-----------+
| id (PK)  |       +-----------+      | id (PK)   |
| store_id |       | id (PK)   |      | order_id  |
| name     |       | category_id      | menu_name |
| sort_order       | store_id  |      | quantity  |
+----------+       | name      |      | unit_price|
                   | price     |      +-----------+
                   | description
                   | image_url |
                   | sort_order|
                   | is_active |
                   +-----------+

+--------------+       +---------------+
| TableSession |       | OrderHistory  |
+--------------+       +---------------+
| id (PK/UUID)|       | id (PK)       |
| store_id    |       | original_order_id |
| table_id    |       | store_id      |
| started_at  |       | table_id      |
| ended_at    |       | session_id    |
| is_active   |       | order_number  |
+--------------+       | items_json    |
                       | total_amount  |
                       | ordered_at    |
                       | completed_at  |
                       +---------------+

+------------------+
| LoginAttempt     |
+------------------+
| id (PK)          |
| store_id         |
| attempt_count    |
| locked_until     |
| last_attempt_at  |
+------------------+

+------------------+
| OrderCounter     |
+------------------+
| id (PK)          |
| store_id         |
| date (YYYY-MM-DD)|
| counter          |
+------------------+
```

---

## 엔티티 상세 정의

### 1. Store (매장)
| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | String (UUID) | PK | 매장 고유 식별자 |
| name | String(100) | NOT NULL | 매장명 |
| username | String(50) | NOT NULL, UNIQUE | 관리자 사용자명 |
| password_hash | String(255) | NOT NULL | bcrypt 해시 비밀번호 |
| created_at | DateTime | NOT NULL, DEFAULT NOW | 생성 시각 |

### 2. Table (테이블)
| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | Integer | PK, AUTO | 테이블 ID |
| store_id | String | FK → Store.id, NOT NULL | 매장 참조 |
| number | Integer | NOT NULL | 테이블 번호 |
| password_hash | String(255) | NOT NULL | 테이블 비밀번호 해시 |
| current_session_id | String (UUID) | NULLABLE | 현재 활성 세션 |
| is_active | Boolean | NOT NULL, DEFAULT TRUE | 활성 여부 |
| created_at | DateTime | NOT NULL | 생성 시각 |

**Unique Constraint**: (store_id, number)

### 3. TableSession (테이블 세션)
| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | String (UUID) | PK | 세션 고유 ID |
| store_id | String | FK → Store.id, NOT NULL | 매장 참조 |
| table_id | Integer | FK → Table.id, NOT NULL | 테이블 참조 |
| started_at | DateTime | NOT NULL | 세션 시작 시각 |
| ended_at | DateTime | NULLABLE | 세션 종료 시각 (이용완료 시) |
| is_active | Boolean | NOT NULL, DEFAULT TRUE | 활성 여부 |

### 4. Category (카테고리)
| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | Integer | PK, AUTO | 카테고리 ID |
| store_id | String | FK → Store.id, NOT NULL | 매장 참조 |
| name | String(50) | NOT NULL | 카테고리명 |
| sort_order | Integer | NOT NULL, DEFAULT 0 | 노출 순서 |

**Unique Constraint**: (store_id, name)

### 5. MenuItem (메뉴 항목)
| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | Integer | PK, AUTO | 메뉴 ID |
| store_id | String | FK → Store.id, NOT NULL | 매장 참조 |
| category_id | Integer | FK → Category.id, NOT NULL | 카테고리 참조 |
| name | String(100) | NOT NULL | 메뉴명 |
| price | Integer | NOT NULL, >= 0 | 가격 (원) |
| description | Text | NULLABLE | 메뉴 설명 |
| image_url | String(500) | NULLABLE | 이미지 URL |
| sort_order | Integer | NOT NULL, DEFAULT 0 | 노출 순서 |
| is_active | Boolean | NOT NULL, DEFAULT TRUE | 활성 여부 |
| created_at | DateTime | NOT NULL | 생성 시각 |
| updated_at | DateTime | NOT NULL | 수정 시각 |

### 6. Order (주문)
| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | Integer | PK, AUTO | 주문 내부 ID |
| store_id | String | FK → Store.id, NOT NULL | 매장 참조 |
| table_id | Integer | FK → Table.id, NOT NULL | 테이블 참조 |
| session_id | String (UUID) | FK → TableSession.id, NOT NULL | 세션 참조 |
| order_number | String(20) | NOT NULL, UNIQUE | 주문 번호 (YYYYMMDD-NNN) |
| status | Enum | NOT NULL, DEFAULT 'pending' | 주문 상태 |
| total_amount | Integer | NOT NULL | 총 금액 |
| created_at | DateTime | NOT NULL | 주문 시각 |
| updated_at | DateTime | NOT NULL | 수정 시각 |

**Status Enum**: `pending` (대기중), `preparing` (준비중), `completed` (완료)

### 7. OrderItem (주문 항목)
| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | Integer | PK, AUTO | 항목 ID |
| order_id | Integer | FK → Order.id, NOT NULL | 주문 참조 |
| menu_name | String(100) | NOT NULL | 메뉴명 (주문 시점 스냅샷) |
| quantity | Integer | NOT NULL, >= 1 | 수량 |
| unit_price | Integer | NOT NULL, >= 0 | 단가 (주문 시점 스냅샷) |

### 8. OrderHistory (주문 이력)
| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | Integer | PK, AUTO | 이력 ID |
| store_id | String | NOT NULL | 매장 ID |
| table_id | Integer | NOT NULL | 테이블 ID |
| session_id | String (UUID) | NOT NULL | 세션 ID |
| order_number | String(20) | NOT NULL | 주문 번호 |
| items_json | Text (JSON) | NOT NULL | 주문 항목 JSON |
| total_amount | Integer | NOT NULL | 총 금액 |
| ordered_at | DateTime | NOT NULL | 주문 시각 |
| completed_at | DateTime | NOT NULL | 이용완료 시각 |

### 9. OrderCounter (주문번호 카운터)
| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | Integer | PK, AUTO | ID |
| store_id | String | NOT NULL | 매장 ID |
| date | String(10) | NOT NULL | 날짜 (YYYY-MM-DD) |
| counter | Integer | NOT NULL, DEFAULT 0 | 당일 순번 |

**Unique Constraint**: (store_id, date)

### 10. LoginAttempt (로그인 시도 추적)
| 필드 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | Integer | PK, AUTO | ID |
| store_id | String | NOT NULL | 매장 ID |
| attempt_count | Integer | NOT NULL, DEFAULT 0 | 연속 실패 횟수 |
| locked_until | DateTime | NULLABLE | 잠금 해제 시각 |
| last_attempt_at | DateTime | NOT NULL | 최근 시도 시각 |

**Unique Constraint**: (store_id)

---

## Testable Properties (PBT-01)

### Round-trip 속성
- OrderItem → JSON 직렬화/역직렬화 (OrderHistory.items_json)
- 주문번호 생성 → 파싱 (날짜 + 순번 추출)

### Invariant 속성
- Order.total_amount == sum(item.quantity * item.unit_price for item in order.items)
- 주문 삭제 후 테이블 총액 == 남은 주문 합계
- 세션 종료 후 활성 주문 수 == 0

### Idempotence 속성
- 주문 상태 동일값 변경 (pending→pending) = 멱등

### Stateful 속성
- 장바구니(프론트) + 주문 생성 → 세션 조회 시 반환
- 테이블 세션 시작→주문→이용완료→이력 이동 시퀀스 검증

---
