export type Feature = {
  title: string;
  description: string;
  badge?: string;
};

export type Plan = {
  name: string;
  tagline: string;
  priceMonthly: number; // 0 = free
  priceYearly: number;  // 0 = free
  highlights: string[];
  ctaLabel: string;
  ctaHref: string;
  recommended?: boolean;
};

export type FaqItem = {
  q: string;
  a: string;
};

export const NAV_ITEMS = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

export const HERO = {
  eyebrow: "AI Subtitle Automation",
  h1: "업로드만 하면 자막이 자동으로 완성됩니다.",
  sub: "STT → 번역 → 편집 → 내보내기(SRT/VTT/MP4)까지. 멀티잡 큐로 대량 처리도 한 번에.",
  primaryCta: { label: "무료로 시작하기", href: "/signup" },
  secondaryCta: { label: "데모 보기", href: "#demo" },
  bullets: ["멀티잡 큐 대량 처리", "자막 편집/프리셋", "SRT·VTT·MP4 Export"],
};

export const SOCIAL_PROOF = [
  { label: "월 절약 시간", value: "40+ hrs" },
  { label: "동시 처리", value: "Multi-job" },
  { label: "지원 포맷", value: "SRT/VTT/MP4" },
  { label: "지원 언어", value: "KR 포함 다국어" },
];

export const FEATURES: Feature[] = [
  { title: "Multi-job Queue", description: "여러 영상 업로드 후 큐로 병렬 처리. 상태/재시도/실패 추적.", badge: "Core" },
  { title: "Subtitle Editor", description: "타임라인, 스타일, 미리보기로 필요한 부분만 빠르게 수동 편집." },
  { title: "Export", description: "SRT/VTT/MP4 Burn-in까지 원하는 형태로 즉시 내보내기." },
  { title: "Templates", description: "자막 스타일 프리셋/이펙트 바리에이션(타이핑, 페이드, 슬라이드) 확장." , badge: "Soon"},
  { title: "Usage Analytics", description: "플랜별 사용량(분/작업수) 및 비용을 투명하게 추적." },
  { title: "API/Webhook", description: "업로드→완료까지 이벤트 훅으로 외부 파이프라인 연동." , badge: "Soon"},
];

export const PLANS: Plan[] = [
  {
    name: "Free",
    tagline: "가볍게 테스트",
    priceMonthly: 0,
    priceYearly: 0,
    highlights: ["기본 STT", "SRT Export", "작은 사용량 포함"],
    ctaLabel: "무료 시작",
    ctaHref: "/signup",
  },
  {
    name: "Starter",
    tagline: "1인 크리에이터",
    priceMonthly: 19,
    priceYearly: 15,
    highlights: ["번역 포함", "편집툴 기본", "사용량 상향"],
    ctaLabel: "Starter 시작",
    ctaHref: "/signup?plan=starter",
  },
  {
    name: "Pro",
    tagline: "대량 처리/팀",
    priceMonthly: 49,
    priceYearly: 39,
    highlights: ["멀티잡 큐 강화", "프리셋/템플릿", "우선 지원"],
    ctaLabel: "Pro 시작",
    ctaHref: "/signup?plan=pro",
    recommended: true,
  },
  {
    name: "Enterprise",
    tagline: "조직/보안/맞춤",
    priceMonthly: 0,
    priceYearly: 0,
    highlights: ["SLA/보안 옵션", "맞춤 연동/API", "전담 지원"],
    ctaLabel: "문의하기",
    ctaHref: "/contact",
  },
];

export const FAQS: FaqItem[] = [
  { q: "지원 언어와 정확도는 어떤가요?", a: "한국어 포함 다국어를 지원하며, 필요 시 용어/표기 규칙을 기준으로 후편집 워크플로우를 제공합니다." },
  { q: "긴 영상이나 대량 업로드도 가능한가요?", a: "멀티잡 큐로 작업을 병렬 처리하고 상태/재시도를 제공합니다. 플랜에 따라 처리량이 달라집니다." },
  { q: "내보내기 포맷은 무엇을 지원하나요?", a: "SRT/VTT/MP4 Burn-in을 기본으로 지원하며, 워크플로우에 맞게 확장 가능합니다." },
  { q: "파일은 어디에 저장되고 얼마나 보관되나요?", a: "보관 기간/삭제 정책은 플랜 정책에 따라 안내됩니다. 조직 플랜에서는 보안 옵션을 확장할 수 있습니다." },
  { q: "결제/플랜 변경은 어떻게 되나요?", a: "언제든 플랜 업/다운그레이드가 가능하도록 설계하며, 사용량 기반 과금은 투명하게 표시됩니다." },
  { q: "편집툴은 어느 정도까지 제공되나요?", a: "타임라인/스타일/프리셋 중심으로 시작하고, 이펙트 프리셋 바리에이션을 지속 추가합니다." },
];
