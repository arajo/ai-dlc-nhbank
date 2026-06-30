# Functional Design Plan - Unit 1: Backend API

## 설계 목표
백엔드 API의 상세 비즈니스 로직, 도메인 엔티티, 비즈니스 규칙 정의

---

## 설계 단계

- [x] 1. 도메인 엔티티 및 관계 설계 (DB 스키마)
- [x] 2. 비즈니스 로직 모델링 (주문 플로우, 세션 관리)
- [x] 3. 비즈니스 규칙 및 검증 로직 정의
- [x] 4. 에러 시나리오 및 예외 처리 정의
- [x] 5. 설계 문서 생성

---

## 설계 질문

---

### Question 1: 주문 번호 생성 규칙
주문 번호를 어떤 형식으로 생성하시겠습니까?

A) 순차 증가 정수 (1, 2, 3, ...) — 단순, 당일 기준 리셋 없음

B) 날짜 기반 순번 (20260630-001, 20260630-002) — 일자별 순번

C) UUID (랜덤 고유 식별자) — 충돌 없음, 길이 길음

D) Other (please describe after [Answer]: tag below)

[Answer]: B

---

### Question 2: 로그인 시도 제한
관리자 로그인 시도 제한을 어떻게 설정하시겠습니까?

A) 5회 실패 시 5분 잠금

B) 10회 실패 시 30분 잠금

C) 3회 실패 시 15분 잠금

D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

### Question 3: 주문 상태 전이 규칙
주문 상태 변경에 제약을 두시겠습니까? (예: "완료" 상태에서 다시 "대기중"으로 되돌릴 수 있는지)

A) 엄격한 전이 — 대기중→준비중→완료 (역방향 불가)

B) 유연한 전이 — 어떤 상태에서든 다른 상태로 변경 가능 (관리자 재량)

C) 부분 유연 — 완료→이전 상태만 불가, 나머지는 자유

D) Other (please describe after [Answer]: tag below)

[Answer]: B

---

### Question 4: 테이블 세션 자동 시작 시점
테이블 세션은 언제 자동으로 시작됩니까?

A) 해당 테이블의 첫 주문 생성 시 자동 시작

B) 고객이 테이블에 로그인할 때 자동 시작

C) 관리자가 수동으로 시작

D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

### Question 5: 메뉴 가격 범위 검증
메뉴 가격의 최소/최대 범위를 어떻게 설정하시겠습니까?

A) 최소 100원 ~ 최대 1,000,000원

B) 최소 0원(무료 가능) ~ 최대 제한 없음

C) 최소 1,000원 ~ 최대 500,000원

D) Other (please describe after [Answer]: tag below)

[Answer]: B

---

### Question 6: 이용 완료 시 주문 이력 보관 기간
과거 주문 이력을 얼마나 보관하시겠습니까?

A) 무기한 보관 (삭제하지 않음)

B) 30일 보관 후 자동 삭제

C) 90일 보관 후 자동 삭제

D) Other (please describe after [Answer]: tag below)

[Answer]: B

---
