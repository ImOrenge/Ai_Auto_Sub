"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PLANS, type Plan } from "@/lib/landing-data";
import { Check, Minus, HelpCircle } from "lucide-react";

type Billing = "monthly" | "yearly";

function priceLabel(plan: Plan, billing: Billing) {
    const p = billing === "monthly" ? plan.priceMonthly : plan.priceYearly;
    if (plan.name === "Enterprise") return "Custom";
    if (p === 0) return "Free";
    return `$${p}`;
}

// 플랜 비교표 데이터
const COMPARISON_FEATURES = [
    {
        category: "기본 기능",
        features: [
            { name: "AI STT 자막 생성", free: true, creator: true, pro: true, enterprise: true },
            { name: "자막 편집기", free: true, creator: true, pro: true, enterprise: true },
            { name: "SRT/VTT 내보내기", free: true, creator: true, pro: true, enterprise: true },
            { name: "MP4 Burn-in 내보내기", free: false, creator: true, pro: true, enterprise: true },
        ]
    },
    {
        category: "AI 기능",
        features: [
            { name: "AI 번역", free: false, creator: true, pro: true, enterprise: true },
            { name: "다국어 동시 번역", free: false, creator: false, pro: true, enterprise: true },
            { name: "번역 언어 수", free: "-", creator: "10개", pro: "90+", enterprise: "90+" },
        ]
    },
    {
        category: "처리량",
        features: [
            { name: "월간 처리 시간", free: "30분", creator: "300분", pro: "1,000분", enterprise: "무제한" },
            { name: "동시 작업 수", free: "1개", creator: "3개", pro: "10개", enterprise: "무제한" },
            { name: "최대 파일 크기", free: "500MB", creator: "2GB", pro: "5GB", enterprise: "무제한" },
        ]
    },
    {
        category: "고급 기능",
        features: [
            { name: "스타일 프리셋 저장", free: false, creator: true, pro: true, enterprise: true },
            { name: "팀 협업", free: false, creator: false, pro: true, enterprise: true },
            { name: "API 연동", free: false, creator: false, pro: true, enterprise: true },
            { name: "전용 지원", free: false, creator: false, pro: "이메일", enterprise: "24/7" },
        ]
    },
];

// 사용량 기준 설명
const USAGE_INFO = [
    { label: "처리 시간", desc: "영상 길이 기준으로 차감됩니다. 예: 10분 영상 = 10분 차감" },
    { label: "동시 작업", desc: "동시에 처리할 수 있는 영상 수입니다. 대기열에는 무제한 추가 가능" },
    { label: "파일 보관", desc: "Free 7일, Creator 30일, Pro 90일, Enterprise 무제한" },
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
                                <th className="text-left py-4 px-4 font-semibold min-w-[200px]">기능</th>
                                <th className="text-center py-4 px-4 font-semibold">Free</th>
                                <th className="text-center py-4 px-4 font-semibold">Creator</th>
                                <th className="text-center py-4 px-4 font-semibold bg-primary/5 rounded-t-lg">
                                    Pro
                                    <span className="ml-1 text-xs text-primary">(인기)</span>
                                </th>
                                <th className="text-center py-4 px-4 font-semibold">Enterprise</th>
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
                                            <td className="py-3 px-4 text-center">{renderValue(feature.free)}</td>
                                            <td className="py-3 px-4 text-center">{renderValue(feature.creator)}</td>
                                            <td className="py-3 px-4 text-center bg-primary/5">{renderValue(feature.pro)}</td>
                                            <td className="py-3 px-4 text-center">{renderValue(feature.enterprise)}</td>
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
