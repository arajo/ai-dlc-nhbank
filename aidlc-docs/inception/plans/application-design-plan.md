# Application Design Plan - 테이블오더 서비스

## 설계 목표
프론트엔드/백엔드 컴포넌트 식별, 서비스 레이어 설계, 컴포넌트 간 의존성 및 통신 패턴 정의

---

## 설계 단계

- [x] 1. 백엔드 컴포넌트 식별 및 책임 정의
- [x] 2. 프론트엔드 컴포넌트 식별 및 책임 정의
- [x] 3. 컴포넌트 메서드 시그니처 정의
- [x] 4. 서비스 레이어 설계 (오케스트레이션)
- [x] 5. 컴포넌트 의존성 및 통신 패턴 정의
- [x] 6. 설계 문서 생성 및 통합

---

## 설계 질문

아래 질문에 답변해 주세요. 각 [Answer]: 태그 뒤에 선택지를 기입해주세요.

---

### Question 1: 백엔드 아키텍처 패턴
FastAPI 백엔드의 코드 구조를 어떤 패턴으로 구성하시겠습니까?

A) 기능별 분리 (Feature-based) — 도메인별 폴더: orders/, menus/, tables/, auth/ 각각에 라우터+서비스+모델 포함

B) 계층별 분리 (Layer-based) — routers/, services/, models/, repositories/ 등 기술 계층별 폴더

C) 혼합 (Hybrid) — 최상위는 계층별, 큰 도메인은 하위에서 기능별 분리

D) Other (please describe after [Answer]: tag below)

[Answer]: C

---

### Question 2: 프론트엔드 구성
React 프론트엔드를 어떻게 구성하시겠습니까?

A) 단일 React 앱 (고객용 + 관리자용을 라우팅으로 분리)

B) 두 개의 별도 React 앱 (고객용 앱 + 관리자용 앱 별도 빌드/배포)

C) Other (please describe after [Answer]: tag below)

[Answer]: A

---

### Question 3: 상태 관리 (프론트엔드)
React 프론트엔드의 전역 상태 관리 도구는 무엇을 사용하시겠습니까?

A) React Context + useReducer (내장 기능, 외부 의존성 없음)

B) Zustand (경량 상태 관리 라이브러리)

C) Redux Toolkit (강력한 상태 관리, 보일러플레이트 다소 있음)

D) Jotai/Recoil (원자적 상태 관리)

E) Other (please describe after [Answer]: tag below)

[Answer]: A

---

### Question 4: API 통신 레이어 (프론트엔드)
프론트엔드에서 서버 API 호출에 어떤 도구를 사용하시겠습니까?

A) TanStack Query (React Query) — 서버 상태 관리, 캐싱, 자동 재요청

B) SWR — 경량 데이터 페칭 라이브러리

C) Axios + 커스텀 훅 — 직접 구현

D) Fetch API + 커스텀 훅 — 외부 의존성 최소화

E) Other (please describe after [Answer]: tag below)

[Answer]: D

---

### Question 5: 데이터 접근 패턴 (백엔드)
SQLite 접근에 어떤 방식을 사용하시겠습니까?

A) SQLAlchemy ORM (Full ORM — 모델 매핑, 관계 정의, 마이그레이션)

B) SQLAlchemy Core (SQL Expression Language — ORM 없이 쿼리 빌더)

C) 순수 SQL + aiosqlite (직접 SQL 작성, 최소 추상화)

D) Tortoise ORM (비동기 전용 ORM)

E) Other (please describe after [Answer]: tag below)

[Answer]: A

---

### Question 6: 인증 토큰 저장 위치 (프론트엔드)
JWT 토큰을 프론트엔드에서 어디에 저장하시겠습니까?

A) localStorage (간단, XSS 취약 가능성 있지만 MVP에 적합)

B) httpOnly Cookie (서버가 설정, XSS에 안전, CSRF 처리 필요)

C) 메모리 + Refresh Token in httpOnly Cookie (가장 안전, 구현 복잡)

D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

### Question 7: UI 컴포넌트 라이브러리
React UI 구현에 어떤 접근을 사용하시겠습니까?

A) Tailwind CSS + 직접 컴포넌트 구현 (유연, 커스터마이즈 용이)

B) Material UI (MUI) — 완성도 높은 컴포넌트 세트

C) Ant Design — 엔터프라이즈급 UI 라이브러리

D) shadcn/ui + Tailwind CSS — 복사 기반 컴포넌트, 높은 커스터마이즈

E) Other (please describe after [Answer]: tag below)

[Answer]: C

---

### Question 8: 모노레포 vs 멀티레포
프로젝트 코드 저장소 구조를 어떻게 하시겠습니까?

A) 모노레포 (백엔드 + 프론트엔드 하나의 저장소에 함께)

B) 멀티레포 (백엔드 저장소 + 프론트엔드 저장소 분리)

C) Other (please describe after [Answer]: tag below)

[Answer]: A

---
