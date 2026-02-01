"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PLANS, type Plan } from "@/lib/landing-data";
import { Check, Minus, HelpCircle } from "lucide-react";

type Billing = "monthly" | "yearly";

function priceLabel(plan: Plan, billing: Billing) {
    const p = billing === "monthly" ? plan.priceMonthly : plan.priceYearly;
    return `$${p}`;
}

// 플랜 비교표 데이터
const COMPARISON_FEATURES = [
    {
        category: "Credits & Core",
        features: [
            { name: "Included Credits", starter: "330", pro: "660", plus: "1320", max: "1980" },
            { name: "Sub Bonus", starter: "+10%", pro: "+10%", plus: "+10%", max: "+10%" },
            { name: "Concurrent Exports", starter: "1", pro: "2", plus: "3", max: "5" },
            { name: "Queue Priority", starter: "Standard", pro: "Standard", plus: "Priority", max: "Highest" },
        ]
    },
    {
        category: "Output Quality",
        features: [
            { name: "HD (720p)", starter: true, pro: true, plus: true, max: true },
            { name: "FHD (1080p)", starter: true, pro: true, plus: true, max: true },
            { name: "UHD (4K)", starter: false, pro: true, plus: true, max: true },
        ]
    },
    {
        category: "Content & Templates",
        features: [
            { name: "Basic Templates", starter: true, pro: true, plus: true, max: true },
            { name: "Premium Templates", starter: "Partial", pro: "Full", plus: "Full", max: "Full" },
            { name: "Cinematic Templates", starter: false, pro: false, plus: "Partial", max: "Full" },
        ]
    },
    {
        category: "Storage & Support",
        features: [
            { name: "Storage Retention", starter: "7 Days", pro: "30 Days", plus: "60 Days", max: "90 Days" },
            { name: "Priority Support", starter: false, pro: false, plus: true, max: true },
        ]
    },
];

// 사용량 기준 설명
const USAGE_INFO = [
    { label: "Processing", desc: "자막 생성 및 번역 시 분당 0.2 크레딧이 소모됩니다." },
    { label: "Export", desc: "렌더링 시 화질과 효과 티어에 따라 분당 크레딧이 차감됩니다." },
    { label: "저장 기간", desc: "결과물은 플랜별로 7일에서 최대 90일까지 보관됩니다." },
];

export default function PricingSection() {
    const [billing, setBilling] = useState<Billing>("monthly");
    const [showComparison, setShowComparison] = useState(false);

    const note = useMemo(() => {
        return billing === "yearly" ? "연간 결제 시 약 20% 할인" : "월간 결제";
    }, [billing]);

    const renderValue = (value: boolean | string) => {
        if (typeof value === "boolean") {
            return value ? (
                <Check className="w-4 h-4 text-green-500 mx-auto" />
            ) : (
                <Minus className="w-4 h-4 text-muted-foreground/30 mx-auto" />
            );
        }
        return <span className="text-sm">{value}</span>;
    };

    return (
        <section id="pricing" className="mx-auto max-w-6xl px-4 py-16 md:py-24 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
            {/* Header */}
            <div className="text-center mb-12">
                <span className="inline-block px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full mb-4">
                    Pricing
                </span>
                <h2 className="text-3xl font-bold md:text-4xl">
                    필요에 맞는 플랜을 선택하세요
                </h2>
                <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
                    모든 플랜에 기본 STT와 편집 기능이 포함됩니다. 사용량과 비용은 투명하게 표시됩니다.
                </p>
            </div>

            {/* Billing Toggle */}
            <div className="flex justify-center mb-8">
                <div className="inline-flex items-center gap-1 p-1 rounded-full border border-border bg-muted/50">
                    <button
                        onClick={() => setBilling("monthly")}
                        className={`px-4 py-2 text-sm rounded-full transition-colors ${billing === "monthly"
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        월간
                    </button>
                    <button
                        onClick={() => setBilling("yearly")}
                        className={`px-4 py-2 text-sm rounded-full transition-colors ${billing === "yearly"
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        연간
                        <span className="ml-1 text-xs text-green-500 font-medium">-20%</span>
                    </button>
                </div>
            </div>

            <p className="text-center text-sm text-muted-foreground mb-8">{note}</p>

            {/* Pricing Cards */}
            <div className="grid gap-6 md:grid-cols-4">
                {PLANS.map((p) => (
                    <div
                        key={p.name}
                        className={`relative rounded-2xl border p-6 transition-all hover:shadow-lg ${p.recommended
                            ? "border-primary bg-primary/5 shadow-md"
                            : "border-border bg-card hover:border-primary/30"
                            }`}
                    >
                        {p.recommended && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                <span className="bg-primary text-primary-foreground px-3 py-1 text-xs font-semibold rounded-full">
                                    인기
                                </span>
                            </div>
                        )}

                        <div className="mb-4">
                            <h3 className="text-lg font-semibold">{p.name}</h3>
                            <p className="text-sm text-muted-foreground">{p.tagline}</p>
                        </div>

                        <div className="flex items-baseline gap-1 mb-6">
                            <span className="text-4xl font-bold">{priceLabel(p, billing)}</span>
                            {p.name !== "Enterprise" && priceLabel(p, billing) !== "Free" && (
                                <span className="text-sm text-muted-foreground">
                                    /{billing === "monthly" ? "월" : "월 (연간)"}
                                </span>
                            )}
                        </div>

                        <ul className="space-y-3 mb-6">
                            {p.highlights.map((h) => (
                                <li key={h} className="flex items-center gap-2 text-sm">
                                    <Check className="w-4 h-4 text-green-500 shrink-0" />
                                    <span>{h}</span>
                                </li>
                            ))}
                        </ul>

                        <Link
                            href={p.ctaHref}
                            className={`w-full inline-flex items-center justify-center px-4 py-3 text-sm font-semibold rounded-xl transition-colors ${p.recommended
                                ? "bg-primary text-primary-foreground hover:opacity-90"
                                : "border border-border bg-background hover:bg-muted"
                                }`}
                        >
                            {p.ctaLabel}
                        </Link>
                    </div>
                ))}
            </div>

            {/* Comparison Toggle */}
            <div className="text-center mt-12">
                <button
                    onClick={() => setShowComparison(!showComparison)}
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                    {showComparison ? "비교표 접기" : "플랜 상세 비교표 보기"}
                    <span className={`transition-transform ${showComparison ? "rotate-180" : ""}`}>▼</span>
                </button>
            </div>

            {/* Comparison Table */}
            {showComparison && (
                <div className="mt-8 overflow-x-auto animate-in fade-in slide-in-from-top-4 duration-300">
                    <table className="w-full border-collapse text-sm">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="text-left py-4 px-4 font-semibold min-w-[200px]">Features</th>
                                <th className="text-center py-4 px-4 font-semibold">Starter</th>
                                <th className="text-center py-4 px-4 font-semibold bg-primary/5 rounded-t-lg">
                                    Pro
                                    <span className="ml-1 text-xs text-primary">(인기)</span>
                                </th>
                                <th className="text-center py-4 px-4 font-semibold">Plus</th>
                                <th className="text-center py-4 px-4 font-semibold">Max</th>
                            </tr>
                        </thead>
                        <tbody>
                            {COMPARISON_FEATURES.map((category, catIdx) => (
                                <>
                                    <tr key={`cat-${catIdx}`} className="bg-muted/30">
                                        <td colSpan={5} className="py-3 px-4 font-semibold text-muted-foreground">
                                            {category.category}
                                        </td>
                                    </tr>
                                    {category.features.map((feature, featIdx) => (
                                        <tr key={`feat-${catIdx}-${featIdx}`} className="border-b border-border/50 hover:bg-muted/20">
                                            <td className="py-3 px-4">{feature.name}</td>
                                            <td className="py-3 px-4 text-center">{renderValue((feature as any).starter)}</td>
                                            <td className="py-3 px-4 text-center bg-primary/5">{renderValue((feature as any).pro)}</td>
                                            <td className="py-3 px-4 text-center">{renderValue((feature as any).plus)}</td>
                                            <td className="py-3 px-4 text-center">{renderValue((feature as any).max)}</td>
                                        </tr>
                                    ))}
                                </>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Usage Info */}
            <div className="mt-12 p-6 rounded-2xl border border-border bg-muted/30">
                <div className="flex items-center gap-2 mb-4">
                    <HelpCircle className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">사용량 기준 안내</h3>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                    {USAGE_INFO.map((info) => (
                        <div key={info.label} className="p-4 rounded-xl bg-background border border-border">
                            <div className="font-medium text-sm mb-1">{info.label}</div>
                            <p className="text-xs text-muted-foreground">{info.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
