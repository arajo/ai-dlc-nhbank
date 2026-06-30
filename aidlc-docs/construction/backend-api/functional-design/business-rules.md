# 비즈니스 규칙 - Unit 1: Backend API

---

## 1. 인증 규칙

| ID | 규칙 | 조건 | 동작 |
|----|------|------|------|
| BR-AUTH-01 | 관리자 로그인 잠금 | 연속 5회 실패 | 5분간 로그인 차단 |
| BR-AUTH-02 | 잠금 해제 | locked_until 시간 경과 | attempt_count 리셋, 로그인 허용 |
| BR-AUTH-03 | 성공 시 리셋 | 로그인 성공 | attempt_count = 0, locked_until = null |
| BR-AUTH-04 | JWT 만료 | 발급 후 16시간 | 토큰 무효화, 재로그인 필요 |
| BR-AUTH-05 | 테이블 로그인 | 유효한 store_id + table_number + password | 테이블 전용 JWT 발급 |

---

## 2. 주문 규칙

| ID | 규칙 | 조건 | 동작 |
|----|------|------|------|
| BR-ORD-01 | 주문번호 형식 | 주문 생성 시 | YYYYMMDD-NNN (당일 순번) |
| BR-ORD-02 | 상태 전이 | 관리자 요청 | 모든 상태 간 자유 전이 허용 |
| BR-ORD-03 | 총액 계산 | 주문 생성 시 | total = Σ(quantity × unit_price) |
| BR-ORD-04 | 가격 스냅샷 | 주문 생성 시 | 주문 시점의 메뉴명+단가 저장 (메뉴 변경 영향 없음) |
| BR-ORD-05 | 빈 주문 불가 | items가 빈 배열 | 400 에러 반환 |
| BR-ORD-06 | 수량 검증 | 각 item.quantity | >= 1 이어야 함 |
| BR-ORD-07 | 메뉴 존재 확인 | 각 item.menu_id | 해당 매장의 활성 메뉴여야 함 |
| BR-ORD-08 | 세션 필수 | 주문 생성 시 | 활성 세션 없으면 자동 생성 |

---

## 3. 테이블 세션 규칙

| ID | 규칙 | 조건 | 동작 |
|----|------|------|------|
| BR-TBL-01 | 세션 자동 시작 | 첫 주문 생성 시 (활성 세션 없음) | 새 TableSession 생성 |
| BR-TBL-02 | 이용 완료 | 관리자 요청 | 주문→이력 이동, 세션 종료, 데이터 리셋 |
| BR-TBL-03 | 단일 활성 세션 | 테이블당 | 동시에 1개 세션만 활성 가능 |
| BR-TBL-04 | 빈 세션 종료 | 이용 완료 시 주문 0건 | 정상 처리 (빈 세션도 종료 가능) |
| BR-TBL-05 | 테이블 번호 고유 | 매장 내 | (store_id, number) 조합 고유 |

---

## 4. 메뉴 관리 규칙

| ID | 규칙 | 조건 | 동작 |
|----|------|------|------|
| BR-MNU-01 | 가격 범위 | 메뉴 등록/수정 | price >= 0 (상한 없음) |
| BR-MNU-02 | 필수 필드 | 메뉴 등록 | name, price, category_id 필수 |
| BR-MNU-03 | 카테고리 존재 | 메뉴 등록/수정 | 해당 매장 소속 카테고리여야 함 |
| BR-MNU-04 | 삭제 시 비활성화 | 메뉴 삭제 요청 | is_active = false (소프트 삭제) |
| BR-MNU-05 | 순서값 양수 | sort_order 설정 | >= 0 |
| BR-MNU-06 | 카테고리명 고유 | 매장 내 | (store_id, name) 조합 고유 |

---

## 5. 데이터 정리 규칙

| ID | 규칙 | 조건 | 동작 |
|----|------|------|------|
| BR-CLN-01 | 이력 보관 | 이용 완료 후 30일 | 자동 삭제 |
| BR-CLN-02 | 카운터 정리 | 일 1회 | 30일 이전 OrderCounter 삭제 |

---

## 6. 검증 규칙 요약

### 입력 검증 (Pydantic Schema)
| 필드 | 검증 규칙 |
|------|-----------|
| store_id | 비어있지 않은 문자열 |
| username | 1~50자 |
| password | 1~100자 |
| table_number | 정수 >= 1 |
| menu_name | 1~100자 |
| price | 정수 >= 0 |
| quantity | 정수 >= 1 |
| image_url | 유효한 URL 형식 또는 빈 문자열 |
| category_name | 1~50자 |

### HTTP 에러 코드 매핑
| 상황 | 코드 | 메시지 |
|------|------|--------|
| 인증 실패 | 401 | Invalid credentials |
| 계정 잠금 | 423 | Account locked. Try again in X minutes |
| 리소스 미존재 | 404 | Resource not found |
| 입력 검증 실패 | 422 | Validation error (Pydantic 자동) |
| 중복 리소스 | 409 | Resource already exists |
| 서버 에러 | 500 | Internal server error |

---
