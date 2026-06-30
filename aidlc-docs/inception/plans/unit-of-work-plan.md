# Unit of Work Plan - 테이블오더 서비스

## 분해 목표
모노레포 내 백엔드(FastAPI)와 프론트엔드(React)를 논리적 작업 단위로 분해하여 CONSTRUCTION 단계에서 순차적으로 설계/구현

---

## 분해 계획

- [x] 1. 작업 단위 식별 및 정의
- [x] 2. 단위 간 의존성 매트릭스 작성
- [x] 3. 요구사항-단위 매핑 작성
- [x] 4. 구현 순서 결정
- [x] 5. 아티팩트 생성 및 검증

---

## 분해 질문

---

### Question 1: 작업 단위 분해 전략
백엔드와 프론트엔드를 어떤 기준으로 작업 단위로 분해하시겠습니까?

A) 계층별 분해 — Unit 1: 백엔드 전체, Unit 2: 프론트엔드 전체 (2개 단위)

B) 기능별 분해 — Unit 1: 백엔드 Core+Auth, Unit 2: 백엔드 Menu+Order+Table, Unit 3: 프론트엔드 고객용, Unit 4: 프론트엔드 관리자용 (4개 단위)

C) 통합 분해 — Unit 1: 백엔드 전체 (Core+Auth+Menu+Order+Table+SSE), Unit 2: 프론트엔드 고객용, Unit 3: 프론트엔드 관리자용 (3개 단위)

D) Other (please describe after [Answer]: tag below)

[Answer]: C

---

### Question 2: 구현 우선순위
어떤 단위를 먼저 구현하시겠습니까?

A) 백엔드 우선 → 프론트엔드 순서 (API가 준비된 후 UI 개발)

B) 풀스택 수직 슬라이스 (한 기능의 백엔드+프론트엔드를 함께 완성 후 다음 기능)

C) Other (please describe after [Answer]: tag below)

[Answer]: B

---
