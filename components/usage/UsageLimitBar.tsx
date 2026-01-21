"use client";

import { cn } from "@/lib/utils";

type UsageLimitBarProps = {
    percentage: number;
    sttMinutes: number;
    limitMinutes: number;
};

export function UsageLimitBar({ percentage, sttMinutes, limitMinutes }: UsageLimitBarProps) {
    const isCritical = percentage >= 100;
    const isWarning = percentage >= 80 && percentage < 100;

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Monthly Credit Usage</span>
                <span className={cn("font-bold", isCritical && "text-destructive", isWarning && "text-amber-500")}>
                    {percentage.toFixed(1)}% Used
                </span>
            </div>

            <div className="h-4 w-full overflow-hidden rounded-full bg-secondary">
                <div
                    className={cn(
                        "h-full transition-all duration-500 ease-out",
                        isCritical ? "bg-destructive" : isWarning ? "bg-amber-500" : "bg-primary"
                    )}
                    style={{ width: `${Math.min(100, percentage)}%` }}
                />
            </div>

            <p className="text-xs text-muted-foreground text-right">
                {sttMinutes.toFixed(1)} / {limitMinutes} minutes
            </p>
        </div>
    );
}
