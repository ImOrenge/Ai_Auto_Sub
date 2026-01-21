export type PlanId = "free" | "starter" | "pro" | "enterprise";

export type PricingPlan = {
  id: PlanId;
  name: string;
  priceMonthly: number | null;
  priceYearly: number | null;
  badge?: string;
  quota: string;
  features: {
    text: string;
    value?: string;
  }[];
  cta: {
    text: string;
    variant: "primary" | "secondary" | "outline"; // outline isn't in PRD but good to have, PRD says Primary/Secondary/Emphasized?
    // PRD says: Free(Primary), Starter(Primary), Pro(Primary, Style="Emphasized"), Enterprise(Secondary)
    // We can map these in the component.
    href: string; // We'll construct this dynamically in the component if needed, or store base template
    condition?: string; // For logic if needed, but easier to handle in component
  };
  emphasis: "Low" | "Medium" | "High";
};

export const pricingPlans: PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    priceMonthly: 0,
    priceYearly: 0,
    quota: "30분", // Period handled in component
    features: [
      { text: "STT(단일 언어)" },
      { text: "SRT 다운로드" },
      { text: "워터마크", value: "ON" },
      { text: "보관 3일" },
      { text: "동시 Job 1" },
    ],
    cta: {
      text: "무료로 시작하기",
      variant: "primary",
      href: "/signup?from=pricing&plan=free",
    },
    emphasis: "Low",
  },
  {
    id: "starter",
    name: "Starter",
    priceMonthly: 19000,
    priceYearly: 190000,
    quota: "300분",
    features: [
      { text: "STT" },
      { text: "번역 1개 언어" },
      { text: "SRT/VTT" },
      { text: "워터마크", value: "OFF" },
      { text: "보관 30일" },
      { text: "동시 Job 3" },
      { text: "지원: 이메일" },
    ],
    cta: {
      text: "시작하기",
      variant: "primary",
      href: "/signup?from=pricing&plan=starter",
    },
    emphasis: "Medium",
  },
  {
    id: "pro",
    name: "Pro",
    priceMonthly: 59000,
    priceYearly: 590000,
    badge: "추천",
    quota: "1500분",
    features: [
      { text: "STT" },
      { text: "번역 최대 5개 언어" },
      { text: "SRT/VTT/TXT" },
      { text: "자막 스타일" },
      { text: "우선 처리" },
      { text: "보관 180일" },
      { text: "동시 Job 10" },
      { text: "팀 멤버 3" },
      { text: "Webhook" },
      { text: "API(기본)" },
    ],
    cta: {
      text: "Pro로 업그레이드",
      variant: "primary", // Special styling for Pro
      href: "/signup?from=pricing&plan=pro",
    },
    emphasis: "High",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    priceMonthly: null,
    priceYearly: null,
    quota: "대량/계약",
    features: [
      { text: "Full API Access" },
      { text: "SLA" },
      { text: "SSO" },
      { text: "감사/로그" },
      { text: "전용 인프라(옵션)" },
      { text: "커스텀 워크플로우" },
    ],
    cta: {
      text: "문의하기",
      variant: "secondary",
      href: "/contact?from=pricing",
    },
    emphasis: "Medium",
  },
];

export type ComparisonRow = {
  feature: string;
  free: string;
  starter: string;
  pro: string;
  enterprise: string;
};

export const comparisonRows: ComparisonRow[] = [
  { feature: "월 제공량", free: "30분", starter: "300분", pro: "1500분", enterprise: "계약" },
  { feature: "STT", free: "O", starter: "O", pro: "O", enterprise: "O" },
  { feature: "번역 언어", free: "X", starter: "1", pro: "최대 5", enterprise: "커스텀" },
  { feature: "포맷", free: "SRT", starter: "SRT/VTT", pro: "SRT/VTT/TXT", enterprise: "커스텀" },
  { feature: "워터마크", free: "ON", starter: "OFF", pro: "OFF", enterprise: "OFF" },
  { feature: "우선 처리", free: "X", starter: "X", pro: "O", enterprise: "O(SLA)" },
  { feature: "Webhook", free: "X", starter: "X", pro: "O", enterprise: "O" },
  { feature: "API", free: "X", starter: "X", pro: "기본", enterprise: "Full" },
  { feature: "팀 멤버", free: "1", starter: "1", pro: "3", enterprise: "무제한" },
  { feature: "보관 기간", free: "3일", starter: "30일", pro: "180일", enterprise: "계약" },
  { feature: "동시 Job", free: "1", starter: "3", pro: "10", enterprise: "커스텀" },
];

export const overagePolicy = {
  items: [
    { label: "STT 초과", value: "₩30 / 분" },
    { label: "번역 초과", value: "₩20 / 분 / 언어" },
    { label: "우선 처리 옵션", value: "+20%" },
  ],
  note: "실패한 Job은 과금되지 않습니다.",
  description: "초과 사용 시에도 멈추지 않습니다. 초과분은 다음 결제일에 합산 청구됩니다.",
};

export const faqItems = [
  {
    q: "무료 플랜도 품질이 같은가요?",
    a: "네, 모델/품질은 동일합니다. 제공량/기능/워터마크만 다릅니다.",
    defaultOpen: true,
  },
  {
    q: "중간에 플랜 변경이 가능한가요?",
    a: "언제든 가능합니다. 업그레이드는 즉시 반영됩니다.",
  },
  {
    q: "사용하지 않은 분량은 이월되나요?",
    a: "기본은 이월되지 않으며, 엔터프라이즈는 협의 가능합니다.",
  },
  {
    q: "결제 수단은 무엇을 지원하나요?",
    a: "카드 결제(국내/해외)를 지원합니다.",
  },
  {
    q: "자막 정확도는 어느 정도인가요?",
    a: "오디오 품질/화자/노이즈에 따라 달라집니다. 결과 미리보기로 확인 가능합니다.",
  },
];
