"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, CreditCard, Activity, Shield, Key } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageContainer } from "@/components/PageContainer";
import { routes } from "@/lib/routes";

const settingsNav = [
    { label: "Profile", href: routes.settings.profile(), icon: User },
    { label: "Usage", href: routes.settings.usage(), icon: Activity },
    { label: "Billing", href: routes.settings.billing(), icon: CreditCard },
    { label: "Security", href: routes.settings.security(), icon: Shield },
    { label: "API", href: routes.settings.api(), icon: Key },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <PageContainer className="gap-8 py-8 pb-32 max-w-7xl mx-auto">
            {/* Header */}
            <section>
                <p className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                    Settings
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                    Account Settings
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Manage your account, billing, and system preferences.
                </p>
            </section>

            <div className="grid gap-6 lg:grid-cols-4">
                <nav className="flex flex-col gap-1 lg:col-span-1">
                    {settingsNav.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                                )}
                            >
                                <Icon className="size-4" />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="lg:col-span-3">
                    <div className="rounded-2xl border bg-card/80 p-6 shadow-sm min-h-[400px]">
                        {children}
                    </div>
                </div>
            </div>
        </PageContainer>
    );
}
