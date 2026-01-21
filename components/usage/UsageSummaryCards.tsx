"use client";

import { CreditCard, Clock, Activity, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type UsageSummaryCardsProps = {
    sttMinutes: number;
    limitMinutes: number;
    percentage: number;
};

export function UsageSummaryCards({ sttMinutes, limitMinutes, percentage }: UsageSummaryCardsProps) {
    const isOverLimit = percentage >= 100;

    return (
        <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border bg-card p-6 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-primary/10 text-primary">
                        <Clock className="size-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Usage</p>
                        <h3 className="text-2xl font-bold">{sttMinutes.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">min</span></h3>
                    </div>
                </div>
            </div>

            <div className="rounded-xl border bg-card p-6 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className={cn("p-3 rounded-full", isOverLimit ? "bg-destructive/10 text-destructive" : "bg-emerald-500/10 text-emerald-600")}>
                        <CreditCard className="size-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Available Credits</p>
                        <h3 className="text-2xl font-bold">
                            {(Math.max(0, limitMinutes - sttMinutes)).toFixed(1)} <span className="text-sm font-normal text-muted-foreground">min</span>
                        </h3>
                    </div>
                </div>
            </div>

            <div className="rounded-xl border bg-card p-6 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-secondary text-secondary-foreground">
                        <Activity className="size-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Current Status</p>
                        <div className="flex items-center gap-2">
                            <span className={cn("inline-flex h-2.5 w-2.5 rounded-full", isOverLimit ? "bg-destructive" : "bg-emerald-500")}></span>
                            <span className="font-semibold">{isOverLimit ? "Limit Exceeded" : "Active"}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
