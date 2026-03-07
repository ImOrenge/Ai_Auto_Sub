"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    CreditCard,
    CheckCircle2,
    Zap,
    ArrowRight,
    TrendingUp,
    Calendar,
    Receipt,
    Check,
    AlertCircle,
    Loader2
} from "lucide-react";
import { CheckoutButton } from "@/components/billing/CheckoutButton";
import { pricingPlans } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";

type BillingData = {
    subscription: any;
    entitlements: any;
    invoices: any[];
};

export default function BillingPage() {
    const { t, language } = useLanguage();
    const [data, setData] = useState<BillingData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBillingData();
    }, []);

    const fetchBillingData = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/internal/billing-data");
            const billingData = await res.json();
            setData(billingData);
        } catch (error) {
            console.error("Failed to fetch billing data", error);
        } finally {
            setLoading(false);
        }
    };

    const currencyFormatter = new Intl.NumberFormat(language === "ko" ? "ko-KR" : "en-US", {
        style: "currency",
        currency: language === "ko" ? "KRW" : "USD",
        maximumFractionDigits: 0
    });

    const formatPrice = (value: number | null) => {
        if (value === null) return language === "ko" ? "별도 문의" : "Contact Us";
        return currencyFormatter.format(value);
    };

    const formatDate = (date: string | Date) =>
        new Intl.DateTimeFormat(language === "ko" ? "ko-KR" : "en-US", {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(new Date(date));

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="size-8 animate-spin text-primary/50" />
            </div>
        );
    }

    if (!data) return null;

    const { subscription, entitlements, invoices } = data;
    const usagePercentage = Math.min(100, ((entitlements?.credits?.used || 0) / (entitlements?.credits?.total || 1)) * 100);

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-xl font-bold tracking-tight">{t("dashboard.billing.title")}</h2>
                <p className="text-sm text-muted-foreground">{t("dashboard.billing.subtitle")}</p>
            </div>

            {/* Current Plan Card */}
            <section className="grid gap-6 lg:grid-cols-3">
                <article className="rounded-2xl border bg-card/80 p-6 shadow-sm lg:col-span-2">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-xs uppercase text-muted-foreground font-bold tracking-wider">{t("dashboard.billing.currentPlan")}</p>
                            <h2 className="mt-1 text-2xl font-bold">{entitlements.planName}</h2>
                        </div>
                        <span className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider",
                            subscription.status === "active"
                                ? "bg-emerald-500/10 text-emerald-500"
                                : "bg-red-500/10 text-red-500"
                        )}>
                            {subscription.status === "active" ? (
                                <>
                                    <CheckCircle2 className="size-3" />
                                    {t("dashboard.billing.active")}
                                </>
                            ) : (
                                <>
                                    <AlertCircle className="size-3" />
                                    {subscription.status}
                                </>
                            )}
                        </span>
                    </div>

                    {/* Usage */}
                    <div className="mt-6">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground font-medium">{t("dashboard.billing.usage")}</span>
                            <span className="font-bold">
                                {entitlements?.credits?.used || 0} / {entitlements?.credits?.total || 0} mins
                            </span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-none bg-secondary">
                            <div
                                className={cn(
                                    "h-full rounded-none transition-all",
                                    entitlements?.credits?.isOverLimit ? "bg-red-500" : "bg-primary"
                                )}
                                style={{ width: `${usagePercentage}%` }}
                            />
                        </div>
                        {entitlements?.credits?.isOverLimit && (
                            <p className="mt-2 text-xs text-red-500 font-medium">
                                {t("dashboard.billing.usageNote")}
                            </p>
                        )}
                    </div>

                    <div className="mt-6 flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="size-4" />
                            {t("dashboard.billing.renews").replace("{date}", formatDate(subscription.currentPeriodEnd))}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <CreditCard className="size-4" />
                            {t("dashboard.billing.cycle").replace("{cycle}", subscription.cycle === "monthly" ? (language === "ko" ? "월간" : "Monthly") : (language === "ko" ? "연간" : "Yearly"))}
                        </div>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                        <button disabled className="inline-flex items-center gap-2 rounded-none border border-border px-5 py-2.5 text-sm font-bold transition hover:bg-secondary disabled:opacity-50">
                            {t("dashboard.billing.managePayment")}
                        </button>
                        <Link
                            href="#plans"
                            className="inline-flex items-center gap-2 rounded-none bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition hover:opacity-90 active:scale-95"
                        >
                            <Zap className="size-4" />
                            {t("dashboard.billing.changePlan")}
                        </Link>
                    </div>
                </article>

                {/* Quick Stats */}
                <div className="grid gap-4">
                    <article className="rounded-2xl border bg-card/80 p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-primary/10 p-2">
                                <TrendingUp className="size-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">{t("dashboard.billing.remaining")}</p>
                                <p className="text-xl font-bold">{entitlements?.credits?.remaining || 0}m</p>
                            </div>
                        </div>
                    </article>
                    <article className="rounded-2xl border bg-card/80 p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-primary/10 p-2">
                                <Receipt className="size-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">{t("dashboard.billing.estTotal")}</p>
                                <p className="text-xl font-bold">{formatPrice(0)}</p>
                            </div>
                        </div>
                    </article>
                </div>
            </section>

            {/* Available Plans */}
            <section id="plans" className="space-y-6">
                <h2 className="text-xl font-bold tracking-tight">{t("dashboard.billing.availablePlans")}</h2>
                <div className="grid gap-6 lg:grid-cols-3">
                    {pricingPlans.map((plan) => (
                        <article
                            key={plan.id}
                            className={cn(
                                "flex flex-col rounded-2xl border bg-card/80 p-6 shadow-sm transition",
                                plan.emphasis === "High" && "border-primary ring-1 ring-primary/30",
                                plan.id === subscription.planId && "ring-2 ring-emerald-500"
                            )}
                        >
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <h3 className="text-xl font-bold">{plan.name}</h3>
                                    {plan.badge && <p className="text-xs font-bold text-primary mt-1 uppercase tracking-wider">{plan.badge}</p>}
                                </div>
                                {plan.id === subscription.planId && (
                                    <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-bold text-emerald-500 uppercase tracking-wider">
                                        Current
                                    </span>
                                )}
                            </div>
                            <div className="mt-4 flex items-baseline gap-1">
                                {plan.priceMonthly !== null ? (
                                    <>
                                        <span className="text-3xl font-bold">{formatPrice(plan.priceMonthly)}</span>
                                        <span className="text-sm text-muted-foreground font-medium">/mo</span>
                                    </>
                                ) : (
                                    <span className="text-2xl font-bold">{language === "ko" ? "별도 문의" : "Contact Us"}</span>
                                )}
                            </div>
                            <div className="mt-2 text-sm font-bold text-secondary-foreground">
                                {plan.quota}
                            </div>

                            <ul className="mt-6 flex-1 space-y-2 text-sm text-muted-foreground">
                                {plan.features.slice(0, 5).map((feature, idx) => (
                                    <li key={idx} className="flex items-center gap-2">
                                        <Check className="size-4 text-primary" />
                                        {feature.text} {feature.value && <span className="font-bold text-foreground"> {feature.value}</span>}
                                    </li>
                                ))}
                                {plan.features.length > 5 && (
                                    <li className="text-xs text-muted-foreground pt-1">+ more</li>
                                )}
                            </ul>
                            <CheckoutButton
                                planId={plan.id}
                                isCurrent={plan.id === subscription.planId}
                                className={cn(
                                    "mt-6 inline-flex items-center justify-center gap-2 rounded-none px-4 py-2.5 text-sm font-bold transition w-full h-11",
                                    plan.id === subscription.planId
                                        ? "border border-border text-muted-foreground cursor-not-allowed"
                                        : "bg-primary text-primary-foreground hover:opacity-90 active:scale-95"
                                )}
                            >
                                {plan.id === subscription.planId ? (language === "ko" ? "현재 플랜" : "Current Plan") : (plan.id === 'free' ? (language === "ko" ? "다운그레이드" : "Downgrade") : (language === "ko" ? "업그레이드" : "Upgrade"))}
                                {plan.id !== subscription.planId && <ArrowRight className="size-4" />}
                            </CheckoutButton>
                        </article>
                    ))}
                </div>
            </section>

            {/* Billing History */}
            <section className="rounded-2xl border bg-card/70 shadow-sm overflow-hidden">
                <div className="border-b p-5 bg-secondary/20">
                    <h2 className="text-lg font-bold tracking-tight">{t("dashboard.billing.history")}</h2>
                </div>
                <div className="divide-y">
                    {invoices.length === 0 ? (
                        <div className="p-8 text-center text-sm text-muted-foreground">
                            {t("dashboard.billing.noHistory")}
                        </div>
                    ) : (
                        invoices.map((invoice) => (
                            <div
                                key={invoice.id}
                                className="flex items-center justify-between p-5 hover:bg-secondary/10 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="rounded-lg bg-secondary p-2">
                                        <Receipt className="size-5 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="font-bold">
                                            {invoice.lineItems[0]?.description || "Service Fee"}
                                        </p>
                                        <p className="text-xs text-muted-foreground font-medium">
                                            {formatDate(invoice.created)}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-lg">{formatPrice(invoice.amountTotal)}</p>
                                    <p className={cn("text-xs font-bold uppercase tracking-wider", invoice.status === "paid" ? "text-emerald-500" : "text-muted-foreground")}>
                                        {invoice.status === "paid" ? (language === "ko" ? "결제 완료" : "Paid") : invoice.status}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>
        </div>
    );
}
