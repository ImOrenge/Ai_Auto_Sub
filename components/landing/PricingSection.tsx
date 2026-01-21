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
                        className={`rounded-lg px-3 py-2 text-sm ${billing === "monthly" ? "bg-white text-neutral-950" : "text-neutral-200 hover:text-white"
                            }`}
                    >
                        월간
                    </button>
                    <button
                        onClick={() => setBilling("yearly")}
                        className={`rounded-lg px-3 py-2 text-sm ${billing === "yearly" ? "bg-white text-neutral-950" : "text-neutral-200 hover:text-white"
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
                        className={`rounded-2xl border p-6 ${p.recommended
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
                            className={`mt-6 inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold ${p.recommended ? "bg-white text-neutral-950 hover:bg-neutral-200" : "border border-white/15 bg-white/5 hover:bg-white/10"
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
