

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
} from "lucide-react";
import { CheckoutButton } from "@/components/billing/CheckoutButton";
import { pricingPlans } from "@/lib/pricing";
import { cn, MOCK_USER_ID } from "@/lib/utils";
import { BillingService } from "@/lib/billing/service";
// Note: BillingService is server-side friendly. If this is a client component, 
// we normally should fetch via API or use Server Components. 
// However, the original file was "export default async function" which implies Server Component.
// Nested layouts supports Server Pages. So we can keep it async and server-side logic!
// EXCEPT, I noticed I changed UsagePage to "use client" (it was client before).
// This file has "export default async function". So it's a Server Component.
// BUT, my Layout is "use client"?? No, layout.tsx I wrote IS "use client" because of usePathname.
// Nested layouts: A Server Component Page CAN form the children of a Client Component Layout.
// So I can keep this as a Server Component. 
// Wait, the previous file had "use client" removed? No, I added "use client" to UsagePage.
// This BillingPage does NOT have "use client" at top. It is a Server Component.
// So I should NOT add "use client" here.

// Wait, looking at the file content I read:
// It imports BillingService which likely uses DB directly.
// So yes, it is a Server Component. 

const currencyFormatter = new Intl.NumberFormat("ko-KR");
const formatPrice = (value: number | null) =>
    value === null ? "별도 문의" : `₩${currencyFormatter.format(value)}`;

const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("ko-KR", { year: 'numeric', month: 'long', day: 'numeric' }).format(date);

export default async function BillingPage() {
    // Fetch data server-side
    // TODO: Get actual logged in user ID
    const userId = MOCK_USER_ID;

    const [subscription, entitlements, invoices] = await Promise.all([
        BillingService.getSubscription(userId),
        BillingService.getEntitlements(userId),
        BillingService.getInvoices(userId),
    ]);

    const usagePercentage = Math.min(100, ((entitlements?.credits?.used || 0) / (entitlements?.credits?.total || 1)) * 100);

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-lg font-semibold">Plans & Billing</h2>
                <p className="text-sm text-muted-foreground">Manage your subscription plan and billing history.</p>
            </div>

            {/* Current Plan Card */}
            <section className="grid gap-6 lg:grid-cols-3">
                <article className="rounded-2xl border bg-card/80 p-6 shadow-sm lg:col-span-2">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-xs uppercase text-muted-foreground">Current Plan</p>
                            <h2 className="mt-1 text-2xl font-semibold">{entitlements.planName}</h2>
                        </div>
                        <span className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
                            subscription.status === "active"
                                ? "bg-emerald-500/10 text-emerald-500"
                                : "bg-red-500/10 text-red-500"
                        )}>
                            {subscription.status === "active" ? (
                                <>
                                    <CheckCircle2 className="size-3" />
                                    Active
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
                            <span className="text-muted-foreground">Usage (STT)</span>
                            <span className="font-medium">
                                {entitlements?.credits?.used || 0} / {entitlements?.credits?.total || 0} mins
                            </span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
                            <div
                                className={cn(
                                    "h-full rounded-full transition-all",
                                    entitlements?.credits?.isOverLimit ? "bg-red-500" : "bg-primary"
                                )}
                                style={{ width: `${usagePercentage}%` }}
                            />
                        </div>
                        {entitlements?.credits?.isOverLimit && (
                            <p className="mt-2 text-xs text-red-500 font-medium">
                                Limit exceeded. Overage will be charged next cycle.
                            </p>
                        )}
                    </div>

                    <div className="mt-6 flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="size-4" />
                            Renews: {formatDate(subscription.currentPeriodEnd)}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <CreditCard className="size-4" />
                            Cycle: {subscription.cycle === "monthly" ? "Monthly" : "Yearly"}
                        </div>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                        <button disabled className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2 text-sm font-semibold transition hover:bg-secondary">
                            Manage Payment Method
                        </button>
                        {/* Dummy Link to Plans */}
                        <Link
                            href="#plans"
                            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                        >
                            <Zap className="size-4" />
                            Change Plan
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
                                <p className="text-xs text-muted-foreground">Remaining</p>
                                <p className="text-xl font-semibold">{entitlements?.credits?.remaining || 0}m</p>
                            </div>
                        </div>
                    </article>
                    <article className="rounded-2xl border bg-card/80 p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-primary/10 p-2">
                                <Receipt className="size-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Est. Total</p>
                                {/* Mock calculated value, in real app BillingService.getUpcomingInvoice() */}
                                <p className="text-xl font-semibold">{formatPrice(0)}</p>
                            </div>
                        </div>
                    </article>
                </div>
            </section>

            {/* Available Plans */}
            <section id="plans" className="space-y-6">
                <h2 className="text-lg font-semibold">Available Plans</h2>
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
                                    <h3 className="text-xl font-semibold">{plan.name}</h3>
                                    {plan.badge && <p className="text-xs font-medium text-primary mt-1">{plan.badge}</p>}
                                </div>
                                {plan.id === subscription.planId && (
                                    <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-500">
                                        Current
                                    </span>
                                )}
                            </div>
                            <div className="mt-4 flex items-baseline gap-1">
                                {plan.priceMonthly !== null ? (
                                    <>
                                        <span className="text-3xl font-semibold">{formatPrice(plan.priceMonthly)}</span>
                                        <span className="text-sm text-muted-foreground">/mo</span>
                                    </>
                                ) : (
                                    <span className="text-2xl font-semibold">Contact Us</span>
                                )}
                            </div>
                            <div className="mt-2 text-sm font-medium text-secondary-foreground">
                                {plan.quota}
                            </div>

                            <ul className="mt-6 flex-1 space-y-2 text-sm text-muted-foreground">
                                {plan.features.slice(0, 5).map((feature, idx) => (
                                    <li key={idx} className="flex items-center gap-2">
                                        <Check className="size-4 text-primary" />
                                        {feature.text} {feature.value && <span className="font-semibold text-foreground"> {feature.value}</span>}
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
                                    "mt-6 inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition w-full h-10",
                                    plan.id === subscription.planId
                                        ? "border border-border text-muted-foreground cursor-not-allowed"
                                        : "bg-primary text-primary-foreground hover:opacity-90 active:scale-95"
                                )}
                            >
                                {plan.id === subscription.planId ? "Current Plan" : (plan.id === 'free' ? 'Downgrade' : 'Upgrade')}
                                {plan.id !== subscription.planId && <ArrowRight className="size-4" />}
                            </CheckoutButton>
                        </article>
                    ))}
                </div>
            </section>

            {/* Billing History */}
            <section className="rounded-2xl border bg-card/70 shadow-sm">
                <div className="border-b p-5">
                    <h2 className="text-lg font-semibold">Billing History</h2>
                </div>
                <div className="divide-y">
                    {invoices.length === 0 ? (
                        <div className="p-8 text-center text-sm text-muted-foreground">
                            No billing history available.
                        </div>
                    ) : (
                        invoices.map((invoice) => (
                            <div
                                key={invoice.id}
                                className="flex items-center justify-between p-5"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="rounded-lg bg-secondary p-2">
                                        <Receipt className="size-5 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="font-medium">
                                            {invoice.lineItems[0]?.description || "Service Fee"}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatDate(invoice.created)}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold">{formatPrice(invoice.amountTotal)}</p>
                                    <p className={cn("text-xs", invoice.status === "paid" ? "text-emerald-500" : "text-muted-foreground")}>
                                        {invoice.status === "paid" ? "Paid" : invoice.status}
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
