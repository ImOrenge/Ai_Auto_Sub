"use client";

import { useEffect, useState } from "react";
import { CreditCard, Clock, Activity, ArrowRight, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { routes } from "@/lib/routes";

type UsageData = {
    period: { start: string; end: string };
    usage: {
        sttMinutes: number;
        limitMinutes: number;
        percentage: number;
    };
};

export function DashboardStats() {
    const [data, setData] = useState<UsageData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsage = async () => {
            try {
                const res = await fetch("/api/usage");
                if (res.ok) {
                    const json = await res.json();
                    setData(json);
                }
            } catch (error) {
                console.error("Failed to fetch usage stats:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchUsage();
    }, []);

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-32 animate-pulse bg-gray-100 dark:bg-gray-800 rounded-none border" />
                ))}
            </div>
        );
    }

    if (!data) return null;

    const { sttMinutes, limitMinutes, percentage } = data.usage;
    const isOverLimit = percentage >= 100;
    const available = Math.max(0, limitMinutes - sttMinutes);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Usage Card */}
            <div className="group relative p-6 bg-white dark:bg-card border rounded-none hover:shadow-lg transition-all">
                <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 rounded-none bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                        <Clock className="size-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Monthly Usage</p>
                        <h3 className="text-2xl font-bold">{sttMinutes.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">min</span></h3>
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-none overflow-hidden">
                        <div
                            className={cn(
                                "h-full transition-all duration-500",
                                isOverLimit ? "bg-red-500" : "bg-indigo-500"
                            )}
                            style={{ width: `${Math.min(100, percentage)}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-[11px] text-muted-foreground">
                        <span>{percentage.toFixed(0)}% used</span>
                        <span>Limit: {limitMinutes}m</span>
                    </div>
                </div>
            </div>

            {/* Credits Card */}
            <div className="group p-6 bg-white dark:bg-card border rounded-none hover:shadow-lg transition-all">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "p-3 rounded-none",
                            isOverLimit ? "bg-red-500/10 text-red-600" : "bg-emerald-500/10 text-emerald-600"
                        )}>
                            <CreditCard className="size-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Available Credits</p>
                            <h3 className="text-2xl font-bold">{available.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">min</span></h3>
                        </div>
                    </div>
                </div>
                <Link
                    href={routes.settings.billing()}
                    className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium border rounded-none hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                    Top up Credits <ArrowRight className="size-4" />
                </Link>
            </div>

            {/* Plan / Status Card */}
            <div className="group p-6 bg-gradient-to-br from-indigo-600 to-purple-700 text-white border-none rounded-none hover:shadow-xl hover:shadow-indigo-500/20 transition-all">
                <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 rounded-none bg-white/20 text-white">
                        <Sparkles className="size-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-white/80">Account Status</p>
                        <h3 className="text-xl font-bold">Pro Plan</h3>
                    </div>
                </div>
                <div className="flex flex-col gap-2">
                    <p className="text-xs text-white/70">Enjoy unlimited translations and priority processing.</p>
                    <Link
                        href={routes.settings.profile()}
                        className="mt-2 w-full flex items-center justify-center gap-2 py-2 text-sm font-medium bg-white/10 hover:bg-white/20 rounded-none transition-colors backdrop-blur-sm"
                    >
                        View Account Settings
                    </Link>
                </div>
            </div>
        </div>
    );
}
