import {
  Monitor,
  Wand2,
  Download,
  Palette,
  BarChart3,
  Webhook,
  Layers,
  type LucideIcon,
} from "lucide-react";

export type Feature = {
  title: string;
  description: string;
  badge?: string;
  icon: LucideIcon;
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

export type Testimonial = {
  name: string;
  role: string;
  company: string;
  avatar: string;
  content: string;
  rating: number;
};

export type UseCase = {
  title: string;
  description: string;
  icon: LucideIcon;
  benefits: string[];
};

export const NAV_ITEMS = [
  { label: "Features", href: "/#features" },
  { label: "How it works", href: "/#how" },
  { label: "Use Cases", href: "/#usecases" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Docs", href: "/docs" },
];

export const HERO = {
  eyebrow: "AI-Powered Subtitle Automation",
  h1: "업로드만 하면 자막이 자동으로 완성됩니다.",
  sub: "AI가 음성을 인식하고, 번역하고, 스타일링까지. 한 번의 클릭으로 SRT, VTT, 자막 입힌 MP4까지 바로 받아보세요.",
  primaryCta: { label: "무료로 시작하기", href: "/signup" },
  secondaryCta: { label: "기능 살펴보기", href: "#features" },
  bullets: [
    "AI 음성 인식 90개+ 언어 지원",
    "실시간 자막 편집 & 스타일 커스텀",
    "SRT · VTT · MP4 Burn-in Export"
  ],
  stats: [
    { value: "90+", label: "지원 언어" },
    { value: "40시간", label: "월 평균 절약 시간" },
    { value: "99.2%", label: "STT 정확도" },
  ],
};

export const SOCIAL_PROOF = [
  { label: "지원 언어", value: "90+", icon: "globe" },
  { label: "월 절약 시간", value: "40시간+", icon: "clock" },
  { label: "STT 정확도", value: "99.2%", icon: "check" },
  { label: "Export 포맷", value: "SRT/VTT/MP4", icon: "download" },
];

export const FEATURES: Feature[] = [
  { 
    title: "직관적인 편집 인터페이스", 
    description: "전문 영상 편집 소프트웨어 수준의 타임라인과 실시간 미리보기를 통해 누구나 쉽게 자막을 다듬을 수 있습니다.", 
    badge: "Core",
    icon: Monitor 
  },
  { 
    title: "AI 스마트 에디터", 
    description: "타임라인에서 실시간 편집. 자막 수정, 싱크 조정, 스타일 미리보기를 한 화면에서.", 
    icon: Wand2 
  },
  { 
    title: "다양한 Export", 
    description: "SRT, VTT 자막 파일은 물론, 자막이 입혀진 MP4 영상까지 원클릭 다운로드.", 
    icon: Download 
  },
  { 
    title: "스타일 프리셋", 
    description: "폰트, 색상, 외곽선, 위치를 자유롭게. 프리셋으로 저장해서 일관된 스타일 적용.", 
    badge: "Popular",
    icon: Palette 
  },
  { 
    title: "사용량 대시보드", 
    description: "플랜별 사용량(분/작업수)을 실시간 추적. 비용을 투명하게 관리하세요.", 
    icon: BarChart3 
  },
  { 
    title: "API & Webhook", 
    description: "업로드부터 완료까지 이벤트 훅으로 자동화. 외부 시스템과 쉽게 연동.", 
    badge: "Soon",
    icon: Webhook 
  },
];

export const TESTIMONIALS: Testimonial[] = [
  {
    name: "김민수",
    role: "유튜브 크리에이터",
    company: "구독자 50만+",
    avatar: "KM",
    content: "영상 10개 자막 작업에 하루 종일 걸리던 게 이제 1시간이면 끝나요. 번역 품질도 생각보다 좋아서 후편집만 살짝 하면 됩니다.",
    rating: 5,
  },
  {
    name: "이지은",
    role: "콘텐츠 마케터",
    company: "스타트업 A사",
    avatar: "LJ",
    content: "다국어 자막이 필요한 글로벌 마케팅에 필수 툴이 됐어요. 한국어로 만든 영상을 영어, 일본어로 바로 번역해서 올릴 수 있어요.",
    rating: 5,
  },
  {
    name: "박준혁",
    role: "영상 에디터",
    company: "프리랜서",
    avatar: "PJ",
    content: "클라이언트 영상 자막 작업 속도가 3배는 빨라졌어요. 특히 타임라인 편집 기능이 직관적이라 싱크 맞추기가 훨씬 편해졌습니다.",
    rating: 5,
  },
];

export const USE_CASES: UseCase[] = [
  {
    title: "유튜브 크리에이터",
    description: "영상 업로드 전 자막 작업 시간을 획기적으로 단축. 자동 번역으로 해외 시청자도 확보하세요.",
    icon: Wand2,
    benefits: ["자동 자막 생성으로 시간 절약", "다국어 번역으로 글로벌 도달", "숏츠 비율 변환 지원"],
  },
  {
    title: "마케팅 팀",
    description: "브랜드 영상, 광고 소재에 빠르게 자막 추가. 팀원들과 프로젝트를 공유하고 협업하세요.",
    icon: Layers,
    benefits: ["브랜드 스타일 프리셋 저장", "팀 협업 기능", "대량 영상 일괄 처리"],
  },
  {
    title: "교육 콘텐츠 제작자",
    description: "강의 영상, 튜토리얼에 정확한 자막 추가. 학습자의 이해도와 접근성을 높이세요.",
    icon: BarChart3,
    benefits: ["긴 영상도 빠르게 처리", "전문 용어 수동 교정 쉬움", "SRT 파일로 LMS 연동"],
  },
];

export const BEFORE_AFTER = {
  before: {
    title: "기존 자막 작업",
    items: [
      { text: "영상 업로드 & 정리에 30분+", pain: true },
      { text: "수동 받아쓰기 또는 외주 의뢰", pain: true },
      { text: "번역가에게 따로 번역 요청", pain: true },
      { text: "싱크 맞추기 수작업 반복", pain: true },
      { text: "포맷 변환 툴 따로 사용", pain: true },
    ],
  },
  after: {
    title: "AI Sub Auto",
    items: [
      { text: "드래그 앤 드롭으로 즉시 업로드", pain: false },
      { text: "AI가 자동으로 음성 인식", pain: false },
      { text: "원클릭 다국어 번역", pain: false },
      { text: "타임라인에서 직관적 편집", pain: false },
      { text: "SRT/VTT/MP4 통합 Export", pain: false },
    ],
  },
};

export const PLANS: Plan[] = [
  {
    name: "Free",
    tagline: "가볍게 테스트",
    priceMonthly: 0,
    priceYearly: 0,
    highlights: ["기본 STT", "SRT Export", "월 30분 무료"],
    ctaLabel: "무료 시작",
    ctaHref: "/signup",
  },
  {
    name: "Creator",
    tagline: "1인 크리에이터",
    priceMonthly: 19,
    priceYearly: 15,
    highlights: ["번역 포함", "편집툴 기본", "월 300분"],
    ctaLabel: "Creator 시작",
    ctaHref: "/signup?plan=creator",
  },
  {
    name: "Pro",
    tagline: "대량 처리/팀",
    priceMonthly: 49,
    priceYearly: 39,
    highlights: ["고급 편집 도구", "프리셋/템플릿", "월 1,000분"],
    ctaLabel: "Pro 시작",
    ctaHref: "/signup?plan=pro",
    recommended: true,
  },
  {
    name: "Enterprise",
    tagline: "조직/보안/맞춤",
    priceMonthly: 0,
    priceYearly: 0,
    highlights: ["SLA/보안 옵션", "맞춤 연동/API", "무제한"],
    ctaLabel: "문의하기",
    ctaHref: "/contact",
  },
];

export const FAQS: FaqItem[] = [
  { q: "지원 언어와 정확도는 어떤가요?", a: "한국어, 영어, 일본어, 중국어 등 90개 이상의 언어를 지원합니다. STT 정확도는 평균 99% 이상이며, 전문 용어는 수동 교정 기능으로 보완할 수 있습니다." },
  { q: "긴 영상이나 대량 업로드도 가능한가요?", a: "직관적인 편집 인터페이스로 긴 영상도 빠르게 작업할 수 있습니다. Pro 플랜 기준 월 1,000분까지 처리 가능하며, Enterprise는 무제한입니다." },
  { q: "내보내기 포맷은 무엇을 지원하나요?", a: "SRT, VTT 자막 파일과 함께, 자막이 영상에 입혀진(Burn-in) MP4 파일도 다운로드할 수 있습니다." },
  { q: "파일은 어디에 저장되고 얼마나 보관되나요?", a: "모든 파일은 암호화되어 안전하게 저장됩니다. Free 플랜은 7일, 유료 플랜은 90일간 보관됩니다." },
  { q: "결제/플랜 변경은 어떻게 되나요?", a: "언제든 업/다운그레이드가 가능하며, 일할 계산으로 자동 정산됩니다. 환불 정책은 가입 후 7일 이내 전액 환불입니다." },
  { q: "팀원과 함께 사용할 수 있나요?", a: "Pro 이상 플랜에서 팀 기능을 지원합니다. 프로젝트 공유, 권한 관리, 협업 기능을 사용할 수 있습니다." },
];
