# 회복성(Resiliency) 확장 - 추가 질문

회복성 확장 규칙을 활성화하셨습니다. 아래 질문에 답변해 주세요.

---

## Question 1: RTO/RPO Goals and Disaster Recovery Strategy
복구 시간 목표(RTO)와 복구 지점 목표(RPO)는 어떻게 설정하시겠습니까? 이에 따라 적절한 재해 복구 전략이 결정됩니다.

A) RPO/RTO: 시간 단위 — Backup & Restore 전략. 최저 비용($). 장애 시 백업에서 복원. 비핵심 워크로드에 적합.

B) RPO/RTO: 수십 분 — Pilot Light 전략. 비용: $$. 데이터 실시간, 서비스 대기. 중요 워크로드에 적합.

C) RPO/RTO: 분 단위 — Warm Standby 전략. 비용: $$$. 비즈니스 크리티컬 앱에 적합.

D) RPO/RTO: 실시간 — Multi-site Active/Active 전략. 최고 비용($$$$). 제로 다운타임.

E) N/A — 단일 리전 배포로 충분. 리전 내 멀티존 가용성에 의존.

F) Other (please describe after [Answer]: tag below)

[Answer]: N/A

---

## Question 2: Change Management Process
프로덕션 변경 사항을 어떻게 관리하시겠습니까?

A) 기존 조직의 변경 관리 프로세스 사용 — 도구/프로세스명을 기재해주세요 (예: ServiceNow, Jira)

B) 정식 프로세스 없음 — AI-DLC가 경량 변경 관리 프로세스를 제안

C) N/A — 이 워크로드는 정식 변경 관리에서 제외 (예: 내부 도구). 면제 사유를 문서화.

D) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Question 3: CI/CD and Deployment Tooling
어떤 CI/CD 도구와 배포 프로세스를 사용하시겠습니까?

A) 기존 CI/CD 파이프라인 사용 — 도구명을 기재해주세요 (예: GitHub Actions, GitLab CI, Jenkins)

B) 파이프라인 없음 — AI-DLC가 적절한 CI/CD 파이프라인을 제안

C) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Question 4: Rollback Mechanism
프로덕션 배포 실패 시 어떻게 롤백하시겠습니까?

A) 이전 IaC/아티팩트 버전 재배포 (버전 고정 롤백)

B) Blue/green 스왑으로 이전 환경으로 복귀

C) Canary 자동 롤백 (메트릭 이상 시)

D) 데이터베이스 인식 롤백 필요 (스키마/데이터 마이그레이션 역전)

E) 조직의 기존 롤백 절차 사용

F) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Question 5: Deployment Style
이 워크로드에 적합한 배포 전략은 무엇입니까?

A) Direct / in-place (최저 비용, 비핵심 워크로드에 적합)

B) Rolling (점진적 인스턴스 교체)

C) Blue/green (무중단 전환, 비용 높음)

D) Canary (점진적 트래픽 이동 + 자동 롤백)

E) Other (please describe after [Answer]: tag below)

[Answer]: D

---

## Question 6: Incident Response Process
프로덕션 인시던트는 어떻게 처리하시겠습니까?

A) 기존 인시던트 대응 프로세스 사용 — 참조를 기재해주세요 (예: PagerDuty, 내부 온콜 프로세스)

B) 정식 프로세스 없음 — AI-DLC가 경량 인시던트 대응 및 사후분석(COE) 프로세스를 제안

C) Other (please describe after [Answer]: tag below)

[Answer]: B

---
