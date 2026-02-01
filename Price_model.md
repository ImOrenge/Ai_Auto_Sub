# Pricing & Credits Spec (SaaS) — Caption Render Platform

> 목적: 고해상도 렌더/무거운 템플릿/재익스포트(2~3회) 패턴에서도 **마진을 보호**하면서,
> 사용자에게는 **예측 가능한 “분당 크레딧” 과금 UX**를 제공한다.
>
> 원칙:
> 1) 편집은 무료
> 2) Processing(자막 생성/번역)은 작업당 1회
> 3) Export(렌더/합성)는 내보내기 할 때마다
> 4) 화질 + 효과 티어에 따라 Export 크레딧이 증가
> 5) Plus 플랜을 추가(A안)하여 업셀 점프를 완만하게 한다

---

## 1. Glossary

- **Credit**: 서비스 내 결제/사용 단위
- **Processing**: 음성→텍스트(STT) + 번역(LLM) + 자막 타임라인 생성
- **Export**: 영상+자막 합성 렌더링 후 결과물 생성 (내보내기)
- **Video Minute**: 입력 영상의 길이를 분(min) 단위로 환산한 값 (예: 2분40초 = 2.6667분)
- **Export Count**: 동일 프로젝트에서 Export 실행 횟수 (재익스포트 포함)
- **Template Tier**: 자막 프리셋/효과 무게 등급 (Basic / Premium / Cinematic)

---

## 2. Credit Economy

### 2.1 Credit Value

- **Top-up (추가 구매)**
  - $10 = 100 credits
  - **1 credit = $0.10**

- **Subscription Bonus**
  - 구독 플랜은 결제 크레딧 기준 **+10% 보너스 지급**
  - (Top-up에는 보너스 없음)

> 회계 원칙:  
> - “구독 보너스”는 유지/락인 목적이며, Top-up은 보너스를 주지 않아 마진 안전장치로 사용한다.

---

## 3. Plans (A안 확정)

> 포함 크레딧 = (월 가격 × 10) × 1.10

| Plan   | Price / mo | Included Credits / mo | Concurrent Exports | Queue Priority | Template Access |
|--------|------------|------------------------|--------------------|----------------|-----------------|
| Starter| $30        | 330                    | 1                  | Standard       | Basic + Premium(부분) |
| Pro    | $60        | 660                    | 2                  | Standard       | Basic + Premium(전체) |
| Plus   | $120       | 1320                   | 3                  | Priority       | Basic + Premium(전체) + Cinematic(부분) |
| Max    | $180       | 1980                   | 5                  | Highest        | Basic + Premium + Cinematic(전체) |

### 3.1 Non-cost Levers (업셀용, 마진친화)

- 동시 Export 수(Concurrent Exports)
- 큐 우선순위(Queue Priority)
- 템플릿 접근 범위(Template Access)
- 저장 기간(Storage Retention) 권장
  - Starter: 7일
  - Pro: 30일
  - Plus: 60일
  - Max: 90일

> 결과물 저장/다운로드는 Object Storage 기반으로 운영(egress 리스크 최소화).

---

## 4. Credit Charging Model (분당 기준)

### 4.1 Rounding Policy

- 모든 크레딧 차감은 **0.1 credit 단위로 올림(ceil)** 한다.
  - 예: 0.53 → 0.6, 0.61 → 0.7

> 구현 추천: 내부는 float(또는 milli-credit)로 계산하되, 사용자 UI에는 0.1 단위 표시.

---

## 5. Processing Credits (작업 1회)

### 5.1 Charge Timing

- “자막 생성/번역” 실행 시 1회 차감
- 편집(타임라인 조정/스타일 변경/프리뷰)은 차감 없음

### 5.2 Rate

- **Processing Rate**: `0.20 credits / video-minute`

### 5.3 Formula

- `processing_credits = ceil_to_0.1(video_minutes × 0.20)`

---

## 6. Export Credits (내보내기마다)

### 6.1 Base Rates by Quality (credits / video-minute)

- **HD (720p)**: `0.04`
- **FHD (1080p)**: `0.08`
- **UHD (4K)**: `0.22`

> 위 레이트는 실측(동일 길이 영상 기준) 렌더링 소요 시간 차이를 반영해 캘리브레이션된 값이다.

### 6.2 Template / Effect Tier Multipliers

> “효과 선택 자체”는 과금하지 않는다.  
> **Export 시 렌더 부하가 늘어나는 효과에 대해서만 배수로 반영**한다.

- **Basic ×1.0**
  - typewriter
  - fade in
  - up / down (단순 이동)

- **Premium ×1.3**
  - blur pop (약함: 낮은 blur radius, 최소 glow/shadow)
  - 1~2 레이어 중심 템플릿, 가벼운 모션

- **Cinematic ×1.6**
  - blur pop (강함: 큰 blur radius, glow/shadow 포함)
  - 3+ 레이어 템플릿, 그라데이션/복잡 모션 포함

### 6.3 Formula

- `export_credits = ceil_to_0.1(video_minutes × quality_rate × effect_multiplier)`

### 6.4 Re-export Handling

- Export는 실행할 때마다 차감 (재익스포트 포함)
- 월 평균 재익스포트 횟수 가정: 2~3회(운영 지표로 지속 측정/조정)

---

## 7. Credit Cost Example (User-facing)

### Example A: 2m 40s (2.67 min) / 4K / Basic
- Processing: `2.67 × 0.20 = 0.53 → 0.6`
- Export(1회): `2.67 × 0.22 × 1.0 = 0.59 → 0.6`
- Total (1 export): **1.2 credits**

### Example B: 2m 40s / 4K / Premium, 3 exports
- Processing: **0.6**
- Export(1회): `2.67 × 0.22 × 1.3 = 0.76 → 0.8`
- Export(3회): `0.8 × 3 = 2.4`
- Total: **3.0 credits**

---

## 8. Guardrails (마진 보호용 최소 장치)

> 분당 과금 UX를 유지하면서, 특정 프리셋/효과/환경에서 렌더 시간이 급증하는 아웃라이어를 방어한다.

### 8.1 Soft Guardrail (자동 보정)

- 기준 벤치마크 대비 **실제 렌더 시간이 2.5배 초과**하는 경우:
  - 해당 Export는 **effect tier를 Cinematic(×1.6)로 자동 승격**하거나,
  - 초과분에 대해 **추가 배수 적용**
- 사용자 고지 문구:
  - “일부 고해상도/효과 조합에서는 렌더 시간이 증가해 크레딧 소모가 늘어날 수 있습니다.”

> 운영 권장: “자동 승격”은 사용자 경험을 해치지 않도록, 결과 화면에서 차감 내역을 투명하게 제공한다.

---

## 9. Template Spec (개발용 메타데이터)

### 9.1 Template Metadata Fields

- `template_id: string`
- `name: string`
- `tier: "basic" | "premium" | "cinematic"`
- `tags: string[]`
- `version: string`

### 9.2 Rules

- 템플릿 제작자는 `tier`를 반드시 지정해야 한다.
- 기본값은 `premium`으로 두되, 운영자가 추후 re-tiering 가능하도록 한다.

---

## 10. Billing Events & Ledger

### 10.1 Event Types

- `credit_grant_subscription` (구독 포함 크레딧 지급)
- `credit_grant_bonus` (10% 보너스 지급)
- `credit_purchase_topup` (Top-up 구매)
- `credit_debit_processing` (Processing 차감)
- `credit_debit_export` (Export 차감)
- `credit_adjustment` (CS/환불/보정)

### 10.2 Required Fields (모든 이벤트 공통)

- `event_id`
- `user_id`
- `project_id` (없으면 null)
- `timestamp`
- `credits_delta` (지급 +, 차감 -)
- `reason_code`
- `metadata` (video_minutes, quality, tier, exports_count 등)

> 회계/추적 목적: 월별 “크레딧 지급량 vs 실제 사용량”을 통해 소진율과 변동원가를 모니터링한다.

---

## 11. KPI & Accounting Dashboard (운영 필수)

### 11.1 Unit Economics

- 월 제공 크레딧(플랜별)
- 월 사용 크레딧(플랜별)
- 소진율(사용/제공)
- Export 평균 횟수(작업당)
- 화질 믹스(HD/FHD/4K 비중)
- 템플릿 티어 믹스(Basic/Premium/Cinematic 비중)

### 11.2 CAC / LTV / ROI (정의)

- CAC (Google Ads, CPC 기반):
  - `CAC = Avg_CPC / (Click→Paid CVR)`
- Monthly Gross Profit (플랜별):
  - `GP = Revenue − VariableCost(credits_used) − FixedCostAllocated`
- LTV (Gross 기준):
  - `LTV = Monthly_GP / Monthly_Churn`
- ROI:
  - `ROI = (LTV − CAC) / CAC`

---

## 12. Fixed Costs (Provided)

- DB: $25 / month
- Cloud: $20 / month
- **Total Fixed Cost: $45 / month**

> 고정비는 사용자 수에 따라 1인당 배분 비용이 감소한다.  
> 손익분기(BEP)는 “월 공헌이익(매출−변동비)” 기준으로 계산한다.

---

## 13. Public Pricing Page Copy (Recommended)

- “편집은 무제한”
- “자막 생성/번역은 영상 길이 기준으로 크레딧 차감”
- “내보내기(Export)는 해상도/효과에 따라 크레딧이 달라집니다”
- “내보내기 횟수(재익스포트)에 따라 크레딧이 추가로 소모됩니다”

---
