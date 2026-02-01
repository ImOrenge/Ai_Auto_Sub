export type PlanId = "free" | "creator" | "pro" | "enterprise";

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
  polarProductId?: string;
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
    polarProductId: undefined, // Free plan doesn't need checkout
  },
  {
    id: "creator",
    name: "Creator",
    priceMonthly: 19900,
    priceYearly: 190800, // 20% discount
    quota: "450분",
    features: [
      { text: "STT" },
      { text: "번역 3개 언어" },
      { text: "SRT/VTT" },
      { text: "워터마크", value: "OFF" },
      { text: "보관 60일" },
      { text: "동시 Job 5" },
      { text: "지원: 이메일" },
    ],
    cta: {
      text: "시작하기",
      variant: "primary",
      href: "/signup?from=pricing&plan=creator",
    },
    emphasis: "Medium",
    polarProductId: "prod_creator_placeholder", // Replace with real ID
  },
  {
    id: "pro",
    name: "Pro",
    priceMonthly: 59900,
    priceYearly: 574800, // 20% discount
    badge: "추천",
    quota: "1800분",
    features: [
      { text: "STT" },
      { text: "번역 무제한" },
      { text: "SRT/VTT/TXT" },
      { text: "자막 스타일 커스텀" },
      { text: "우선 처리" },
      { text: "보관 180일" },
      { text: "동시 Job 20" },
      { text: "팀 멤버 3" },
      { text: "Webhook" },
      { text: "API(기본)" },
    ],
    cta: {
      text: "Pro로 업그레이드",
      variant: "primary",
      href: "/signup?from=pricing&plan=pro",
    },
    emphasis: "High",
    polarProductId: "prod_pro_placeholder", // Replace with real ID
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
    polarProductId: undefined, // Enterprise usually custom
  },
];

export type ComparisonRow = {
  feature: string;
  free: string;
  creator: string;
  pro: string;
  enterprise: string;
};

export const comparisonRows: ComparisonRow[] = [
  { feature: "월 제공량", free: "30분", creator: "450분", pro: "1800분", enterprise: "계약" },
  { feature: "STT", free: "O", creator: "O", pro: "O", enterprise: "O" },
  { feature: "번역 언어", free: "X", creator: "3", pro: "무제한", enterprise: "커스텀" },
  { feature: "포맷", free: "SRT", creator: "SRT/VTT", pro: "SRT/VTT/TXT", enterprise: "커스텀" },
  { feature: "워터마크", free: "ON", creator: "OFF", pro: "OFF", enterprise: "OFF" },
  { feature: "우선 처리", free: "X", creator: "X", pro: "O", enterprise: "O(SLA)" },
  { feature: "Webhook", free: "X", creator: "X", pro: "O", enterprise: "O" },
  { feature: "API", free: "X", creator: "X", pro: "기본", enterprise: "Full" },
  { feature: "팀 멤버", free: "1", creator: "1", pro: "3", enterprise: "무제한" },
  { feature: "보관 기간", free: "3일", creator: "60일", pro: "180일", enterprise: "계약" },
  { feature: "동시 Job", free: "1", creator: "5", pro: "20", enterprise: "커스텀" },
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
