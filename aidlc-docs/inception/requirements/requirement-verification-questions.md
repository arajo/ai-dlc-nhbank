# 테이블오더 서비스 - 요구사항 확인 질문

제공해주신 요구사항 문서를 분석했습니다. 아래 질문에 대해 [Answer]: 태그 뒤에 선택지를 기입해주세요.

---

## Question 1
본 프로젝트의 목표 환경은 무엇입니까?

A) 단일 매장 (1개 매장만 운영)

B) 멀티 매장 (여러 매장을 하나의 시스템에서 관리)

C) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 2
매장당 테이블 수의 예상 규모는 어느 정도입니까?

A) 소규모 (1~10 테이블)

B) 중규모 (11~30 테이블)

C) 대규모 (31~100 테이블)

D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 3
메뉴 이미지 관리 방식을 어떻게 하시겠습니까?

A) 외부 이미지 URL 직접 입력 (별도 이미지 호스팅 서비스 사용)

B) 서버에 이미지 파일 업로드 기능 포함

C) 이미지 없이 텍스트 기반으로만 운영 (MVP 단계)

D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 4
백엔드 기술 스택에 대한 선호가 있으십니까?

A) Node.js (Express/NestJS 등)

B) Python (FastAPI/Django 등)

C) Java/Kotlin (Spring Boot 등)

D) Go

E) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Question 5
프론트엔드 기술 스택에 대한 선호가 있으십니까?

A) React (Next.js 포함)

B) Vue.js (Nuxt.js 포함)

C) Svelte/SvelteKit

D) 순수 HTML/CSS/JavaScript

E) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 6
데이터베이스에 대한 선호가 있으십니까?

A) 관계형 데이터베이스 (PostgreSQL)

B) 관계형 데이터베이스 (MySQL/MariaDB)

C) NoSQL (MongoDB)

D) SQLite (경량 개발용)

E) Other (please describe after [Answer]: tag below)

[Answer]: D

---

## Question 7
배포 환경에 대한 계획이 있으십니까?

A) AWS (EC2, ECS, Lambda 등)

B) 온프레미스 서버 또는 VPS (단일 서버 배포)

C) Docker 컨테이너 기반 (배포 환경 미정)

D) 배포 환경은 나중에 결정 (로컬 개발 우선)

E) Other (please describe after [Answer]: tag below)

[Answer]: D

---

## Question 8
동시 접속 사용자 수의 예상 규모는 어느 정도입니까?

A) 소규모 (동시 10명 이하)

B) 중규모 (동시 11~50명)

C) 대규모 (동시 51~200명)

D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 9
관리자 계정 관리 방식은 어떻게 하시겠습니까?

A) 단일 관리자 계정 (매장당 1개 계정)

B) 다중 관리자 계정 (매장당 여러 직원 계정, 역할 구분 없음)

C) 역할 기반 다중 계정 (매장 오너, 매니저, 직원 구분)

D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 10
고객용 태블릿 인터페이스의 주요 타겟 디바이스는 무엇입니까?

A) 태블릿 전용 (iPad, 안드로이드 태블릿 10인치 이상)

B) 태블릿 + 스마트폰 호환 (반응형)

C) 모든 화면 크기 지원 (반응형 웹)

D) Other (please describe after [Answer]: tag below)

[Answer]: C

---

## Question 11: Security Extensions
이 프로젝트에 보안 확장 규칙을 적용하시겠습니까?

A) 예 — 모든 보안 규칙을 blocking 제약 조건으로 적용 (프로덕션 애플리케이션에 권장)

B) 아니오 — 보안 규칙 건너뛰기 (PoC, 프로토타입, 실험적 프로젝트에 적합)

C) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Question 12: Resiliency Extensions
이 프로젝트에 회복성(Resiliency) 기본 규칙을 적용하시겠습니까?

이 확장을 활성화하면 AWS Well-Architected Framework(신뢰성 기둥)에 기반한 설계 시점의 모범 사례가 적용됩니다. 내결함성, 고가용성, 관측성, 복구 가능성에 대한 지침이 포함됩니다.

A) 예 — 회복성 기본 규칙을 설계 지침으로 적용 (비즈니스 크리티컬 워크로드에 권장)

B) 아니오 — 회복성 규칙 건너뛰기 (PoC, 프로토타입에 적합)

C) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 13: Property-Based Testing Extension
이 프로젝트에 속성 기반 테스팅(Property-Based Testing) 규칙을 적용하시겠습니까?

A) 예 — 모든 PBT 규칙을 blocking 제약 조건으로 적용 (비즈니스 로직, 데이터 변환이 있는 프로젝트에 권장)

B) 부분 적용 — 순수 함수와 직렬화에 대해서만 PBT 규칙 적용

C) 아니오 — PBT 규칙 건너뛰기 (단순 CRUD, UI 전용 프로젝트에 적합)

D) Other (please describe after [Answer]: tag below)

[Answer]: A

---
