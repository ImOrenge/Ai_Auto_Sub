1) 폴더 구조(권장)
app/
  page.tsx

components/
  landing/
    LandingPage.tsx
    HeaderSticky.tsx
    HeroSplit.tsx
    SocialProofStrip.tsx
    ProblemSolution.tsx
    HowItWorksTimeline.tsx
    FeatureGrid.tsx
    PricingSection.tsx
    FAQAccordion.tsx
    FinalCTA.tsx
    Footer.tsx

lib/
  landing-data.ts

2) app/page.tsx
// app/page.tsx
import LandingPage from "@/components/landing/LandingPage";

export default function Page() {
  return <LandingPage />;
}

3) lib/landing-data.ts (카피/데이터만 분리)
// lib/landing-data.ts
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

4) components/landing/LandingPage.tsx
// components/landing/LandingPage.tsx
import HeaderSticky from "./HeaderSticky";
import HeroSplit from "./HeroSplit";
import SocialProofStrip from "./SocialProofStrip";
import ProblemSolution from "./ProblemSolution";
import HowItWorksTimeline from "./HowItWorksTimeline";
import FeatureGrid from "./FeatureGrid";
import PricingSection from "./PricingSection";
import FAQAccordion from "./FAQAccordion";
import FinalCTA from "./FinalCTA";
import Footer from "./Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50">
      <HeaderSticky />

      <main>
        <HeroSplit />
        <SocialProofStrip />
        <ProblemSolution />
        <HowItWorksTimeline />
        <FeatureGrid />
        <PricingSection />
        <FAQAccordion />
        <FinalCTA />
      </main>

      <Footer />
    </div>
  );
}

5) HeaderSticky.tsx
// components/landing/HeaderSticky.tsx
import Link from "next/link";
import { NAV_ITEMS } from "@/lib/landing-data";

export default function HeaderSticky() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-neutral-950/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="h-7 w-7 rounded-lg bg-white/10 ring-1 ring-white/10" />
          <span className="text-sm font-semibold tracking-wide">AI Sub Auto</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {NAV_ITEMS.map((it) => (
            <Link key={it.href} href={it.href} className="text-sm text-neutral-200 hover:text-white">
              {it.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/login" className="rounded-lg px-3 py-2 text-sm text-neutral-200 hover:text-white">
            로그인
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-neutral-950 hover:bg-neutral-200"
          >
            무료로 시작
          </Link>
        </div>
      </div>
    </header>
  );
}

6) HeroSplit.tsx (Hero + “데모 앵커/스크린샷 영역”)
// components/landing/HeroSplit.tsx
import Link from "next/link";
import { HERO } from "@/lib/landing-data";

export default function HeroSplit() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
        <div className="flex flex-col justify-center">
          <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-neutral-200">
            <span className="h-1.5 w-1.5 rounded-full bg-white/60" />
            {HERO.eyebrow}
          </div>

          <h1 className="text-3xl font-semibold leading-tight md:text-5xl">
            {HERO.h1}
          </h1>

          <p className="mt-4 max-w-xl text-base leading-relaxed text-neutral-200 md:text-lg">
            {HERO.sub}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href={HERO.primaryCta.href}
              className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-neutral-950 hover:bg-neutral-200"
            >
              {HERO.primaryCta.label}
            </Link>
            <Link
              href={HERO.secondaryCta.href}
              className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm text-white hover:bg-white/10"
            >
              {HERO.secondaryCta.label}
            </Link>
          </div>

          <ul className="mt-6 grid gap-2 text-sm text-neutral-200">
            {HERO.bullets.map((b) => (
              <li key={b} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-white/60" />
                {b}
              </li>
            ))}
          </ul>
        </div>

        {/* Visual / Demo */}
        <div className="flex items-center">
          <div
            id="demo"
            className="w-full rounded-2xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]"
          >
            <div className="flex items-center justify-between">
              <div className="text-xs text-neutral-200">Dashboard Preview</div>
              <div className="flex gap-2">
                {["UPLOADED", "STT", "TRANSLATE", "DONE"].map((s) => (
                  <span key={s} className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-neutral-200">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-video rounded-xl bg-black/30 ring-1 ring-white/10">
                  <div className="p-3 text-xs text-neutral-300">Video #{i}</div>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-xl bg-black/30 p-3 ring-1 ring-white/10">
              <div className="text-xs text-neutral-300">Subtitle Editor (Preview)</div>
              <div className="mt-2 h-14 rounded-lg bg-white/5" />
            </div>
          </div>
        </div>
      </div>

      {/* subtle background */}
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-40">
        <div className="absolute left-[-20%] top-[-20%] h-[420px] w-[420px] rounded-full bg-white/10 blur-3xl" />
        <div className="absolute right-[-20%] bottom-[-30%] h-[520px] w-[520px] rounded-full bg-white/10 blur-3xl" />
      </div>
    </section>
  );
}

7) SocialProofStrip.tsx
// components/landing/SocialProofStrip.tsx
import { SOCIAL_PROOF } from "@/lib/landing-data";

export default function SocialProofStrip() {
  return (
    <section className="border-y border-white/10 bg-white/[0.03]">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-10 md:grid-cols-4">
        {SOCIAL_PROOF.map((it) => (
          <div key={it.label} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs text-neutral-300">{it.label}</div>
            <div className="mt-1 text-lg font-semibold">{it.value}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

8) ProblemSolution.tsx
// components/landing/ProblemSolution.tsx
export default function ProblemSolution() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="text-sm font-semibold">Before</div>
          <p className="mt-2 text-sm leading-relaxed text-neutral-200">
            자막 제작은 반복 작업이 많고, 영상이 늘수록 편집/번역/내보내기까지 사람이 직접 관리해야 합니다.
            품질은 올라가도 시간과 비용이 계속 증가합니다.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-neutral-200">
            {["업로드/정리/대기", "STT 결과 확인", "번역/표기 통일", "편집/싱크 조정", "포맷 내보내기"].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-white/60" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="text-sm font-semibold">After</div>
          <p className="mt-2 text-sm leading-relaxed text-neutral-200">
            AI Sub Auto는 파이프라인을 “작업 큐”로 표준화합니다. 자동으로 만들고, 필요한 부분만 사람이 편집해
            빠르게 완성합니다.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-neutral-200">
            {["멀티잡 큐로 병렬 처리", "상태/재시도/실패 추적", "편집툴로 후편집 최소화", "SRT/VTT/MP4 즉시 Export", "사용량/비용 투명"].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-white/60" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

9) HowItWorksTimeline.tsx
// components/landing/HowItWorksTimeline.tsx
const STEPS = [
  { title: "Upload", desc: "URL 또는 로컬 업로드 → Job 생성" },
  { title: "STT", desc: "자동 전사 + 타임코드 생성" },
  { title: "Translate", desc: "다국어 번역(옵션) + 표기 규칙" },
  { title: "Edit & Export", desc: "필요한 부분만 편집 → SRT/VTT/MP4" },
];

export default function HowItWorksTimeline() {
  return (
    <section id="how" className="mx-auto max-w-6xl px-4 py-16 md:py-20">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold md:text-3xl">How it works</h2>
        <p className="mt-2 max-w-2xl text-sm text-neutral-200">
          복잡한 흐름을 “표준 파이프라인 + 상태 머신”으로 고정해서, 운영이 쉬워지고 결과가 일관됩니다.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {STEPS.map((s, idx) => (
          <div key={s.title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between">
              <div className="text-xs text-neutral-300">Step {idx + 1}</div>
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-neutral-200">
                {s.title.toUpperCase()}
              </span>
            </div>
            <div className="mt-3 text-base font-semibold">{s.title}</div>
            <p className="mt-2 text-sm leading-relaxed text-neutral-200">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

10) FeatureGrid.tsx
// components/landing/FeatureGrid.tsx
import { FEATURES } from "@/lib/landing-data";

export default function FeatureGrid() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-4 py-16 md:py-20">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold md:text-3xl">Features</h2>
        <p className="mt-2 max-w-2xl text-sm text-neutral-200">
          자동화는 “기능”이 아니라 “운영 경험”입니다. 큐/상태/편집/내보내기를 한 흐름으로 제공합니다.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between">
              <div className="text-base font-semibold">{f.title}</div>
              {f.badge ? (
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-neutral-200">
                  {f.badge}
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-neutral-200">{f.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

11) PricingSection.tsx (토글 포함: Client Component)
// components/landing/PricingSection.tsx
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PLANS, type Plan } from "@/lib/landing-data";

type Billing = "monthly" | "yearly";

function priceLabel(plan: Plan, billing: Billing) {
  const p = billing === "monthly" ? plan.priceMonthly : plan.priceYearly;
  if (plan.name === "Enterprise") return "Custom";
  if (p === 0) return "Free";
  return `$${p}`;
}

export default function PricingSection() {
  const [billing, setBilling] = useState<Billing>("monthly");

  const note = useMemo(() => {
    return billing === "yearly" ? "연간 결제 시 할인 적용" : "월간 결제";
  }, [billing]);

  return (
    <section id="pricing" className="mx-auto max-w-6xl px-4 py-16 md:py-20">
      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold md:text-3xl">Pricing</h2>
          <p className="mt-2 max-w-2xl text-sm text-neutral-200">
            플랜은 “작업량/팀 규모/자동화 깊이”에 맞춰 선택하세요. 사용량과 비용은 투명하게 표시됩니다.
          </p>
        </div>

        <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-1">
          <button
            onClick={() => setBilling("monthly")}
            className={`rounded-lg px-3 py-2 text-sm ${
              billing === "monthly" ? "bg-white text-neutral-950" : "text-neutral-200 hover:text-white"
            }`}
          >
            월간
          </button>
          <button
            onClick={() => setBilling("yearly")}
            className={`rounded-lg px-3 py-2 text-sm ${
              billing === "yearly" ? "bg-white text-neutral-950" : "text-neutral-200 hover:text-white"
            }`}
          >
            연간
          </button>
        </div>
      </div>

      <div className="mb-6 text-sm text-neutral-300">{note}</div>

      <div className="grid gap-4 md:grid-cols-4">
        {PLANS.map((p) => (
          <div
            key={p.name}
            className={`rounded-2xl border p-6 ${
              p.recommended
                ? "border-white/30 bg-white/10"
                : "border-white/10 bg-white/5"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-base font-semibold">{p.name}</div>
                <div className="mt-1 text-xs text-neutral-300">{p.tagline}</div>
              </div>
              {p.recommended ? (
                <span className="rounded-full border border-white/15 bg-white/10 px-2 py-1 text-[10px] text-neutral-100">
                  Recommended
                </span>
              ) : null}
            </div>

            <div className="mt-5 flex items-end gap-2">
              <div className="text-3xl font-semibold">{priceLabel(p, billing)}</div>
              {p.name !== "Enterprise" && priceLabel(p, billing) !== "Free" ? (
                <div className="pb-1 text-xs text-neutral-300">/ {billing === "monthly" ? "mo" : "mo (billed yearly)"}</div>
              ) : null}
            </div>

            <ul className="mt-5 space-y-2 text-sm text-neutral-200">
              {p.highlights.map((h) => (
                <li key={h} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-white/60" />
                  {h}
                </li>
              ))}
            </ul>

            <Link
              href={p.ctaHref}
              className={`mt-6 inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold ${
                p.recommended ? "bg-white text-neutral-950 hover:bg-neutral-200" : "border border-white/15 bg-white/5 hover:bg-white/10"
              }`}
            >
              {p.ctaLabel}
            </Link>
          </div>
        ))}
      </div>

      {/* 비교표는 다음 단계로 확장 가능 */}
      <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-neutral-200">
        <div className="font-semibold">Tip</div>
        <p className="mt-2 text-neutral-200">
          다음 단계에서 “플랜 비교표(Feature Comparison)”와 “사용량(분/작업수) 기준”을 여기에 붙이면 결제 전환이 더 좋아져.
        </p>
      </div>
    </section>
  );
}

12) FAQAccordion.tsx
// components/landing/FAQAccordion.tsx
import { FAQS } from "@/lib/landing-data";

export default function FAQAccordion() {
  return (
    <section id="faq" className="mx-auto max-w-6xl px-4 py-16 md:py-20">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold md:text-3xl">FAQ</h2>
        <p className="mt-2 max-w-2xl text-sm text-neutral-200">
          결제/품질/보관/편집 범위에서 많이 나오는 질문을 미리 정리했습니다.
        </p>
      </div>

      <div className="grid gap-3">
        {FAQS.map((f) => (
          <details key={f.q} className="group rounded-2xl border border-white/10 bg-white/5 p-5">
            <summary className="cursor-pointer list-none text-sm font-semibold">
              <div className="flex items-center justify-between gap-4">
                <span>{f.q}</span>
                <span className="text-neutral-300 group-open:rotate-45 transition">+</span>
              </div>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-neutral-200">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

13) FinalCTA.tsx
// components/landing/FinalCTA.tsx
import Link from "next/link";

export default function FinalCTA() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-16 md:pb-24">
      <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 to-white/5 p-8 md:p-12">
        <h3 className="text-2xl font-semibold md:text-3xl">
          이제, 자막 작업을 “운영”하세요.
        </h3>
        <p className="mt-3 max-w-2xl text-sm text-neutral-200 md:text-base">
          업로드 → 자동 처리 → 필요한 부분만 편집 → 다양한 포맷으로 내보내기.
          AI Sub Auto는 반복을 줄이고 결과를 표준화합니다.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link href="/signup" className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-neutral-950 hover:bg-neutral-200">
            무료로 시작하기
          </Link>
          <Link href="/login" className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm text-white hover:bg-white/10">
            로그인
          </Link>
        </div>
      </div>
    </section>
  );
}

14) Footer.tsx
// components/landing/Footer.tsx
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-neutral-950">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 py-12 md:grid-cols-4">
        <div>
          <div className="text-sm font-semibold">Product</div>
          <div className="mt-3 grid gap-2 text-sm text-neutral-200">
            <Link href="#features" className="hover:text-white">Features</Link>
            <Link href="#pricing" className="hover:text-white">Pricing</Link>
            <Link href="/changelog" className="hover:text-white">Changelog</Link>
          </div>
        </div>

        <div>
          <div className="text-sm font-semibold">Resources</div>
          <div className="mt-3 grid gap-2 text-sm text-neutral-200">
            <Link href="/docs" className="hover:text-white">Docs</Link>
            <Link href="/status" className="hover:text-white">Status</Link>
            <Link href="/support" className="hover:text-white">Support</Link>
          </div>
        </div>

        <div>
          <div className="text-sm font-semibold">Company</div>
          <div className="mt-3 grid gap-2 text-sm text-neutral-200">
            <Link href="/about" className="hover:text-white">About</Link>
            <Link href="/contact" className="hover:text-white">Contact</Link>
          </div>
        </div>

        <div>
          <div className="text-sm font-semibold">Legal</div>
          <div className="mt-3 grid gap-2 text-sm text-neutral-200">
            <Link href="/terms" className="hover:text-white">Terms</Link>
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-10 text-xs text-neutral-400">
        © {new Date().getFullYear()} AI Sub Auto. All rights reserved.
      </div>
    </footer>
  );
}