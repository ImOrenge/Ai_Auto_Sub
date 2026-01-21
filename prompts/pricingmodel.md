1) 실사용 구조의 목표

플랜 변경해도 규칙이 안 꼬임 (Starter→Pro, 월/연 전환)

잡 1개 = 사용량 1번 계산 (성공/부분성공/실패 구분)

초과 과금은 “다음 청구서에 합산” 가능

통계가 “조회용 집계”가 아니라 정산 가능한 데이터에서 나옴

2) 운영 데이터 모델 (권장)
A. Plan / Entitlement (기능 제공)

plans : Free/Starter/Pro/Enterprise 정의 (가격, 기본 제공량)

plan_features : 기능 플래그(번역, webhook, api 등)

entitlements : “현재 유저가 누리는 권리” 스냅샷(플랜 + 예외/프로모션)

✅ 포인트: 플랜=상품, entitlement=현재 적용 규칙(실행 기준)

B. Subscription / Billing (결제)

subscriptions

user_id

plan_id

billing_cycle (monthly/yearly)

status (active/canceled/past_due)

current_period_start/end

invoices (청구서)

invoice_line_items (기본 구독 + 초과 사용분)

C. Usage Ledger (사용량 원장) — 가장 중요

usage_ledger

user_id

job_id

metric (stt_minutes / translation_minutes / priority_fee)

quantity (분, 언어-분 등)

unit_price (초과 과금 단가, 0도 가능)

amount (정산 금액)

period_key (YYYY-MM)

status (pending/posted/void)

reason (included/overage/promo/failed_job)

✅ “통계”는 여기서 집계하면 결제/감사 대응 가능

D. Jobs (실행 단위)

jobs

input_duration_sec

stt_minutes_billed

translation_languages

translation_minutes_billed

priority (bool)

status (queued/running/succeeded/failed/partial)

cost_snapshot (잡 실행 시점의 가격/규칙 스냅샷)

✅ 플랜 변경 중에도 과금 흔들리지 않게 잡에 스냅샷 저장 추천

3) 플랜별 “실사용 제한” 정의 방식
제공량(Allowance)을 “분리 객체”로

allowance_rules

Free: stt 30분 / 번역 0 / 동시잡 1 / 보관 3일

Starter: stt 300분 / 번역 300분*1언어 / 동시잡 3 / 보관 30일

Pro: stt 1500분 / 번역 1500분*최대5언어 / 동시잡 10 / 보관 180일

번역은 실무에서 “언어-분(language_minutes)”로 잡는 게 깔끔해:

10분 영상, 3개 언어 번역 → translation_language_minutes = 30

4) 잡 실행 시 과금/차감 로직 (운영 플로우)
Step 1) 잡 시작 전: 사전 체크

동시 잡 제한 확인 (active jobs count)

기능 권한 확인 (번역/webhook/api)

예상 비용 프리뷰(옵션)

Step 2) 잡 완료 후: 사용량 확정

실제 처리된 billed_minutes 계산

포함 제공량에서 차감 → 부족분은 overage로 분리

usage_ledger에 라인아이템 생성(posted)

Step 3) 청구서 생성 시

해당 기간 usage_ledger amount 합산

기본 구독료 + 초과 사용분 = invoice

실패 처리 원칙

failed → usage_ledger void

partial → 실제 산출물 나온 구간만 billed

5) 대시보드/통계 “실사용형”으로 바꾸는 기준

통계는 “예쁜 그래프”보다 아래 3개가 핵심이야.

(1) 이번 결제주기 잔여 제공량

STT 잔여분

번역 잔여 언어-분

우선 처리 사용량

(2) 초과 예상 금액

“지금까지 초과분 ₩xx”

“현재 추세면 월말 ₩xx 예상”

(3) 잡 기준 운영지표

성공률(성공/실패/부분성공)

평균 처리시간

분당 비용(내부 cost vs 청구 amount) → 마진 추적 가능

6) 네가 바꿔야 할 실제 화면 구조(추천)
/billing (결제 중심)

현재 플랜 / 다음 결제일

이번 주기 제공량/초과

결제수단 / 인보이스 목록

/usage (사용량 중심)

기간 필터(이번달/지난달)

usage_ledger 집계

초과 과금 라인아이템 상세

/jobs

잡 리스트(상태/분량/언어/비용)

잡 상세에 “이 잡이 만든 usage 라인” 노출 (감사/클레임 대응)

7) 바로 적용 가능한 “변경 계획” (순서)

usage_ledger 먼저 도입 (기존 통계 계산을 ledger 기반으로 바꾸기)

entitlements 도입 (플랜/기능/제한 분리)

jobs 완료 시 cost_snapshot 저장

인보이스/초과 합산 로직 적용

UI를 /billing /usage /jobs 기준으로 재배치

공통 전제
목적

/billing: “내가 지금 어떤 플랜이고, 이번 결제주기에서 얼마 쓰고/얼마 나올지”를 한 화면에

/usage: “사용량 원장(ledger) 기반”으로 분해/필터/내보내기

/jobs: “실행(운영) 화면” + 각 Job이 만든 usage 라인까지 연결(클레임/감사 대응)

라우팅/권한

/billing, /usage, /jobs는 로그인 필수

플랜별 UI gating:

Free: API/Webhook 항목 비활성 + 업그레이드 CTA

Starter: 번역 1언어, 동시잡 3, etc

Pro: 다국어/우선처리/Webhook/API enabled

Enterprise: 별도 표기 + “계약 기준” 문구

핵심 데이터 소스

subscription(현재 플랜/주기/다음 결제일)

entitlements(기능/제한 스냅샷)

usage_ledger(정산 가능한 사용량 원장)

jobs(실행 단위) + job.cost_snapshot

공통 상단 네비(앱 영역)

좌측 사이드바: Dashboard / Jobs / Usage / Billing / Settings

각 페이지 간 딥링크:

Job 상세 → 해당 job의 usage 라인 보기(/usage?jobId=...)

Usage 라인 → job 상세(/jobs/:id)

Billing → 결제주기 usage 요약(/usage?period=current)

1) /billing PRD
1.1 목표(KPI)

플랜 업그레이드 전환율(Pro)

결제 이슈(실패/연체) 해결률

“이번달 예상 청구액” 확인률

1.2 페이지 IA

Current Plan Summary

Cycle Allowance & Overage Summary

Billing Cycle (월/연) + Plan Change

Payment Method

Invoices List

Support/Contact (Enterprise 문의, 결제 문제)

1.3 핵심 UI 요구사항
A. Current Plan Summary (상단 카드)

플랜명, 월/연 주기, 상태(active/past_due/canceled)

다음 결제일(기간 start/end)

버튼:

플랜 변경(Starter/Pro/Enterprise)

결제 관리(결제수단/인보이스)

past_due면 결제수단 업데이트 강조

B. 이번 결제주기 제공량/사용량 요약 (정산 가능한 수치)

표시 항목(필수):

STT: 사용/제공/잔여

번역: 언어-분 사용/제공/잔여 (예: 300/300, 0잔여)

우선처리: 사용 여부/추가비율(+20%) 누적 금액(있다면)

추가 표시(필수):

이번 주기 초과 예상 금액(현재까지)

월말 예상 금액(추세 기반) (선택)

CTA:

초과 발생 시 사용량 상세 보기 → /usage?period=current

잔여 10% 미만 시 업그레이드 추천

C. Plan Change (업그레이드/다운그레이드 정책 명시)

플랜 선택 UI(Free/Starter/Pro/Enterprise)

월/연 토글

“적용 시점” 규칙:

업그레이드: 즉시 적용 + 차액 정산(프로레이션) (또는 즉시 결제)

다운그레이드: 다음 주기에 적용

확인 모달(필수):

새 가격

적용 시점

기능 제한 변화(동시잡/보관/언어 수)

(있는 경우) 프로레이션 금액

D. Payment Method

현재 결제수단 표시(카드 마지막 4자리 등)

결제수단 변경 버튼(외부 결제 페이지/포털 이동)

실패/연체 상태면 상단 경고 배너 + 해결 CTA

E. Invoices List

기간/상태 필터(성공/실패/환불)

인보이스 카드: 날짜, 총액, 기본 구독/초과 과금 분리 표시

다운로드(PDF) / 상세보기

라인아이템 drill-down:

“초과 과금 상세 보기” → /usage?invoiceId=...

1.4 API 요구사항(예시)

GET /api/billing/summary?period=current

GET /api/billing/subscription

POST /api/billing/change-plan

GET /api/billing/payment-method

GET /api/billing/invoices?cursor=...

1.5 상태/에러

subscription 없음(Free): “현재 Free” + 업그레이드 CTA

past_due: 결제수단 업데이트 강제 안내(일부 기능 제한 가능)

invoice 로딩 실패: 재시도 + 고객지원 링크

1.6 Acceptance Criteria

현재 플랜/다음 결제일/상태가 항상 노출

제공량/사용량/초과금액이 usage_ledger 집계와 일치

업그레이드 즉시 반영, 다운그레이드는 다음 주기 반영

인보이스에서 초과분을 /usage로 drill-down 가능

2) /usage PRD
2.1 목표(KPI)

사용량 문의(“왜 과금됐지?”) 셀프 해결률

원장 기반 export 사용률

초과 과금 투명성 체감

2.2 페이지 IA

Period Picker (이번달/지난달/커스텀)

Summary Tiles (STT/번역/우선처리/총액)

Breakdown (차트/테이블)

Ledger Table (원장 라인 아이템)

Export (CSV) / Share Link (선택)

2.3 핵심 UI 요구사항
A. Period Picker

프리셋: 현재 결제주기, 지난 결제주기, 이번 달, 지난 달

커스텀: date range

period 변경 시 모든 집계/테이블 갱신

B. Summary Tiles (정산 기준)

STT Minutes: 포함/초과 분리

Translation Language-Minutes: 포함/초과 분리

Priority Fees: 누적 금액

Total: 기간 총액(초과분만 또는 전체 표시 옵션)

C. Breakdown (필수 2종)

일자별 사용량(라인) — metric 선택(STT/번역)

초과 과금 구성(도넛 또는 리스트) — STT 초과/번역 초과/우선처리

차트는 “보기용”, 결제 근거는 아래 Ledger로

D. Ledger Table (핵심)

컬럼(필수):

DateTime

Job (링크)

Metric (stt_minutes / translation_language_minutes / priority_fee)

Quantity

Included vs Overage

Unit Price

Amount

Status (posted/void)

Reason (included/overage/promo/failed_job)

필터(필수):

metric 필터

included/overage

jobId 검색

status

행 클릭:

Job 상세로 이동(/jobs/:id)

또는 사이드 패널로 “라인 상세”(단가/규칙 스냅샷 표시)

E. Export

CSV 내보내기

현재 필터/기간 그대로 반영

회계/정산에 쓸 수 있게 amount 포함

2.4 API 요구사항(예시)

GET /api/usage/summary?period=...

GET /api/usage/ledger?period=...&metric=...&cursor=...

GET /api/usage/export.csv?period=...&filters=...

2.5 Acceptance Criteria

/usage의 총액 = ledger amount 합과 일치

jobId로 검색 시 해당 job의 모든 라인이 정확히 조회

인보이스/빌링 페이지에서 넘어온 쿼리(invoiceId 등)로 동일 결과 재현

CSV export가 필터/기간을 그대로 반영

3) /jobs PRD
3.1 목표(KPI)

작업 생성/재시도 성공률

실패 원인 파악 시간 단축

Job→Usage→Billing 연결로 고객문의 감소

3.2 페이지 IA

Jobs List (필터/검색/정렬)

Job Create CTA

Job Detail Drawer/Page

Outputs (SRT/VTT/TXT)

Usage (이 Job이 만든 ledger 라인)

Webhook/API delivery logs (Pro 이상)

3.3 Jobs List 요구사항
A. List Toolbar

검색: 파일명/Job ID

필터:

status (queued/running/succeeded/failed/partial)

기간

language count

overage 발생 여부(yes/no)

정렬:

최신

처리시간

비용(ledger 합)

B. List Row(필수 필드)

status badge

title/file

duration

languages

createdAt

processing time

cost (이 job ledger amount 합)

actions:

상세

재시도(failed/partial)

다운로드(성공 시)

C. 동시잡 제한 UX

제한 초과 시 “대기열로 들어감” 또는 “업그레이드 안내”

Free/Starter에서 동시잡 제한에 걸리면:

“현재 동시 작업 한도: 1/3” 표시

Pro로 업그레이드 CTA

3.4 Job Detail 요구사항(핵심)
A. Overview

상태, 생성일, 입력 길이, 언어 수, 우선처리 여부

단계별 진행(STT → 번역 → 포맷 생성 → 전달)

에러 발생 시:

에러코드/메시지

재시도 버튼

“부분 성공”이면 성공 산출물 우선 제공

B. Outputs

SRT/VTT/TXT 다운로드

버전 관리(재시도 시 새 버전)

보관기간 만료 시 안내 + 업그레이드 CTA

C. Usage for this Job (정산 연결의 핵심)

“이 Job이 생성한 사용량/과금”

표(ledger 라인 표시):

metric, quantity, included/overage, amount

딥링크:

원장 전체에서 보기 → /usage?jobId=...

D. Delivery (Webhook/Export) — Pro 이상

Webhook endpoint 상태(성공/실패)

최근 전송 로그(최대 N개)

재전송 버튼(권한 필요)

3.5 API 요구사항(예시)

GET /api/jobs?filters=...&cursor=...

POST /api/jobs (생성)

GET /api/jobs/:id

POST /api/jobs/:id/retry

GET /api/jobs/:id/outputs

GET /api/jobs/:id/usage-ledger (job 단위 집계/라인)

3.6 Acceptance Criteria

리스트에서 job 비용이 ledger 합과 일치

job 상세에 usage 라인이 반드시 노출되고 /usage로 이동 가능

실패 job은 과금 라인이 void 처리되어 표시(또는 미생성)

플랜 제한(동시잡/보관/언어 수)이 UI/서버에서 동일하게 enforcement