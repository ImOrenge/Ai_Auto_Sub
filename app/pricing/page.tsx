"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, HelpCircle, ArrowRight, Star } from "lucide-react";
import { pricingPlans, comparisonRows, overagePolicy, faqItems } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import { CheckoutButton } from "@/components/billing/CheckoutButton";
import HeaderSticky from "@/components/landing/HeaderSticky";
import Footer from "@/components/landing/Footer";

export default function PricingPage() {
    const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
            <HeaderSticky />

            <main className="relative overflow-hidden pt-24 pb-20">
                {/* Background blobs for premium feel */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] opacity-20 pointer-events-none">
                    <div className="absolute top-0 -left-1/4 w-[500px] h-[500px] bg-primary/30 rounded-full blur-[120px] mix-blend-multiply animate-pulse" />
                    <div className="absolute top-40 -right-1/4 w-[400px] h-[400px] bg-blue-500/20 rounded-full blur-[100px] mix-blend-multiply" />
                </div>

                <div className="container relative z-10 mx-auto px-4">
                    {/* Header Section */}
                    <div className="text-center mb-16">
                        <motion.span
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-block px-4 py-1.5 mb-6 text-xs font-bold tracking-wider uppercase bg-primary/10 text-primary border border-primary/20 rounded-full"
                        >
                            Subscription Plans
                        </motion.span>
                        <motion.h1
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70"
                        >
                            성장을 위한 스마트한 선택
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto"
                        >
                            AI 자막 자동화로 시간을 절약하세요. 필요에 맞는 플랜을 선택하고 지금 바로 시작할 수 있습니다.
                        </motion.p>
                    </div>

                    {/* Billing Toggle */}
                    <div className="flex justify-center items-center gap-4 mb-12">
                        <span className={cn("text-sm font-medium transition-colors", billingCycle === "monthly" ? "text-foreground" : "text-muted-foreground")}>월간 결제</span>
                        <button
                            onClick={() => setBillingCycle(prev => prev === "monthly" ? "yearly" : "monthly")}
                            className="relative w-14 h-7 bg-muted border border-border rounded-full p-1 transition-colors hover:border-primary/50"
                        >
                            <div className={cn(
                                "absolute top-1 left-1 w-5 h-5 bg-primary rounded-full transition-transform shadow-sm",
                                billingCycle === "yearly" ? "translate-x-7" : ""
                            )} />
                        </button>
                        <div className="flex items-center gap-2">
                            <span className={cn("text-sm font-medium transition-colors", billingCycle === "yearly" ? "text-foreground" : "text-muted-foreground")}>연간 결제</span>
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-green-500/10 text-green-600 border border-green-500/20 rounded-md">20% 할인</span>
                        </div>
                    </div>

                    {/* Pricing Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-24">
                        {pricingPlans.map((plan, idx) => (
                            <motion.div
                                key={plan.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 * idx }}
                                className={cn(
                                    "relative flex flex-col p-8 rounded-3xl border transition-all duration-300 group",
                                    plan.emphasis === "High"
                                        ? "bg-card border-primary shadow-2xl shadow-primary/10 scale-105 z-20"
                                        : "bg-card/50 border-border hover:border-primary/50 hover:shadow-xl z-10"
                                )}
                            >
                                {plan.badge && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full shadow-lg">
                                        {plan.badge}
                                    </div>
                                )}

                                <div className="mb-8">
                                    <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{plan.name}</h3>
                                    <div className="flex items-baseline gap-1">
                                        {plan.priceMonthly === null ? (
                                            <span className="text-3xl font-extrabold uppercase tracking-tight">Custom</span>
                                        ) : (
                                            <>
                                                <span className="text-4xl font-extrabold tracking-tight">
                                                    {billingCycle === "monthly" ? `₩${plan.priceMonthly.toLocaleString()}` : `₩${(plan.priceYearly! / 12).toLocaleString()}`}
                                                </span>
                                                <span className="text-muted-foreground text-sm font-medium">/월</span>
                                            </>
                                        )}
                                    </div>
                                    {billingCycle === "yearly" && plan.priceYearly !== 0 && plan.priceYearly !== null && (
                                        <div className="text-xs text-green-600 font-semibold mt-1">
                                            연 ₩{plan.priceYearly.toLocaleString()} (일시불)
                                        </div>
                                    )}
                                </div>

                                <div className="mb-8 flex-grow">
                                    <div className="text-sm font-semibold text-muted-foreground mb-4 py-2 border-y border-border/50">
                                        {plan.quota} 제공
                                    </div>
                                    <ul className="space-y-4">
                                        {plan.features.slice(0, 8).map((feature, fidx) => (
                                            <li key={fidx} className="flex items-start gap-3 group/feat">
                                                <div className="mt-1 w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover/feat:bg-primary/20 transition-colors">
                                                    <Check className="w-2.5 h-2.5 text-primary" />
                                                </div>
                                                <span className="text-sm leading-tight">
                                                    {feature.text} {feature.value && <b className="text-primary">{feature.value}</b>}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {plan.polarProductId ? (
                                    <CheckoutButton
                                        planId={plan.id}
                                        isCurrent={false} // On public pricing page, none is current
                                        className={cn(
                                            "w-full h-12 inline-flex items-center justify-center gap-2 rounded-xl font-bold transition-all active:scale-[0.98]",
                                            plan.emphasis === "High"
                                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90"
                                                : "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border"
                                        )}
                                    >
                                        {plan.cta.text}
                                        <ArrowRight className="w-4 h-4" />
                                    </CheckoutButton>
                                ) : (
                                    <Link
                                        href={plan.cta.href}
                                        className={cn(
                                            "w-full h-12 inline-flex items-center justify-center gap-2 rounded-xl font-bold transition-all active:scale-[0.98]",
                                            plan.emphasis === "High"
                                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90"
                                                : "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border"
                                        )}
                                    >
                                        {plan.cta.text}
                                        <ArrowRight className="w-4 h-4" />
                                    </Link>
                                )}
                            </motion.div>
                        ))}
                    </div>

                    {/* Comparison Table Section */}
                    <div className="mb-24">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold mb-4">플랜 상세 비교</h2>
                            <p className="text-muted-foreground">모든 기능을 한눈에 비교하고 결정하세요.</p>
                        </div>

                        <div className="overflow-x-auto rounded-3xl border border-border bg-card/30 backdrop-blur-sm">
                            <table className="w-full text-left border-collapse min-w-[800px]">
                                <thead>
                                    <tr className="border-b border-border/50">
                                        <th className="p-6 font-bold text-sm text-muted-foreground uppercase tracking-wider">기능</th>
                                        <th className="p-6 font-bold text-center">Free</th>
                                        <th className="p-6 font-bold text-center">Creator</th>
                                        <th className="p-6 font-bold text-center bg-primary/5">Pro</th>
                                        <th className="p-6 font-bold text-center">Enterprise</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/30">
                                    {comparisonRows.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-muted/50 transition-colors">
                                            <td className="p-6 font-medium">{row.feature}</td>
                                            <td className="p-6 text-center text-sm">{row.free === "O" ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : (row.free === "X" ? "-" : row.free)}</td>
                                            <td className="p-6 text-center text-sm font-semibold">{row.creator === "O" ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : row.creator}</td>
                                            <td className="p-6 text-center text-sm font-bold bg-primary/5 text-primary">{row.pro === "O" ? <Check className="w-5 h-5 text-primary mx-auto" /> : row.pro}</td>
                                            <td className="p-6 text-center text-sm font-semibold">{row.enterprise === "O" ? <Check className="w-5 h-5 text-green-500 mx-auto" /> : row.enterprise}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Overage & Notes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-24 items-center">
                        <div className="p-10 rounded-3xl bg-primary/5 border border-primary/10 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-6">
                                    <Star className="w-6 h-6 text-primary" />
                                    <h3 className="text-2xl font-bold">초과 사용량 정책</h3>
                                </div>
                                <div className="space-y-6">
                                    {overagePolicy.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center pb-4 border-b border-primary/10 last:border-0 last:pb-0">
                                            <span className="font-semibold">{item.label}</span>
                                            <span className="text-xl font-extrabold text-primary">{item.value}</span>
                                        </div>
                                    ))}
                                    <div className="bg-background/50 p-4 rounded-2xl border border-primary/5">
                                        <p className="text-sm text-muted-foreground leading-relaxed italic">
                                            " {overagePolicy.description} "
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-2xl font-bold mb-6">자주 묻는 질문</h3>
                            <div className="space-y-4">
                                {faqItems.map((item, idx) => (
                                    <details key={idx} className="group border border-border rounded-2xl overflow-hidden [&_summary::-webkit-details-marker]:hidden bg-card/50 transition-all hover:border-primary/30">
                                        <summary className="flex cursor-pointer items-center justify-between p-6 list-none">
                                            <h4 className="font-bold pr-4">{item.q}</h4>
                                            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center transition-transform group-open:rotate-180">
                                                <ArrowRight className="w-4 h-4 rotate-90" />
                                            </div>
                                        </summary>
                                        <div className="px-6 pb-6 text-muted-foreground text-sm leading-relaxed border-t border-border/50 pt-4">
                                            {item.a}
                                        </div>
                                    </details>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Final CTA */}
                    <div className="text-center bg-gradient-to-br from-primary/20 via-background to-blue-500/10 p-16 rounded-[3rem] border border-primary/20 shadow-xl overflow-hidden relative">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--primary)_0%,transparent_30%)] opacity-5" />
                        <div className="relative z-10">
                            <h2 className="text-4xl md:text-5xl font-black mb-8">준비되셨나요?</h2>
                            <p className="text-xl mb-10 text-muted-foreground max-w-xl mx-auto">
                                지금 가입하고 AI 자막 자동화의 강력한 성능을 직접 경험해 보세요.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link
                                    href="/signup"
                                    className="px-10 py-5 bg-primary text-primary-foreground font-black rounded-2xl shadow-2xl shadow-primary/40 hover:scale-105 transition-all text-lg"
                                >
                                    지금 즉시 시작하기
                                </Link>
                                <Link
                                    href="/contact"
                                    className="px-10 py-5 bg-card border border-border font-bold rounded-2xl hover:bg-muted transition-all text-lg"
                                >
                                    팀 플랜 문의하기
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
