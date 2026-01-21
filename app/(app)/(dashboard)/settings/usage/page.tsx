"use client";

import { Suspense, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { UsageSummaryCards } from "@/components/usage/UsageSummaryCards";
import { UsageLimitBar } from "@/components/usage/UsageLimitBar";
import { UsageTable } from "@/components/usage/UsageTable";
import { UsageLedgerItem } from "@/lib/billing/types";

// ============================================================================
// Types
// ============================================================================

type UsageData = {
    period: { start: string; end: string };
    usage: {
        sttMinutes: number;
        limitMinutes: number;
        percentage: number;
    };
    ledger: UsageLedgerItem[];
};

function UsagePageLoading() {
    return (
        <div className="flex items-center justify-center py-12">
            <Loader2 className="size-8 animate-spin text-primary" />
        </div>
    );
}

export default function UsagePage() {
    return (
        <Suspense fallback={<UsagePageLoading />}>
            <UsagePageContent />
        </Suspense>
    );
}

function UsagePageContent() {
    const [data, setData] = useState<UsageData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchUsage() {
            try {
                const res = await fetch("/api/usage");

                if (!res.ok) {
                    const text = await res.text();
                    console.error("Usage API Error:", res.status, text);
                    try {
                        const json = JSON.parse(text);
                        throw new Error(json.error || `Error ${res.status}`);
                    } catch (e) {
                        throw new Error(`Failed to load usage data: ${res.status}`);
                    }
                }

                const json = await res.json();
                setData(json);
            } catch (e) {
                console.error("Failed to fetch usage", e);
                setError(e instanceof Error ? e.message : "Unknown error");
            } finally {
                setIsLoading(false);
            }
        }
        fetchUsage();
    }, []);

    if (isLoading) return <UsagePageLoading />;

    if (error) return (
        <div className="text-center py-10">
            <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-6 inline-block text-left">
                <p className="text-destructive font-semibold">Error: {error}</p>
                <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-background border rounded hover:bg-secondary">
                    Retry
                </button>
            </div>
        </div>
    );

    if (!data) return null;

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-2">
                <h2 className="text-lg font-semibold">Usage Overview</h2>
                <p className="text-sm text-muted-foreground">
                    Current period: {new Date(data.period.start).toLocaleDateString()} - {new Date(data.period.end).toLocaleDateString()}
                </p>
            </div>

            {/* Summary Cards */}
            <UsageSummaryCards
                sttMinutes={data.usage.sttMinutes}
                limitMinutes={data.usage.limitMinutes}
                percentage={data.usage.percentage}
            />

            {/* Limit Bar */}
            <div className="rounded-xl border bg-card p-6 shadow-sm">
                <UsageLimitBar
                    sttMinutes={data.usage.sttMinutes}
                    limitMinutes={data.usage.limitMinutes}
                    percentage={data.usage.percentage}
                />
            </div>

            {/* Ledger Table */}
            <UsageTable items={data.ledger} />
        </div>
    );
}
