"use client";

import { UsageLedgerItem } from "@/lib/billing/types";
import { cn } from "@/lib/utils";
import { ArrowDownLeft, ArrowUpRight, FileVideo, Plus } from "lucide-react";

type UsageTableProps = {
    items: UsageLedgerItem[];
};

export function UsageTable({ items }: UsageTableProps) {
    return (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="p-6 border-b">
                <h3 className="font-semibold">Usage History</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-muted/40 text-muted-foreground">
                        <tr>
                            <th className="px-6 py-3 text-left font-medium">Date</th>
                            <th className="px-6 py-3 text-left font-medium">Description</th>
                            <th className="px-6 py-3 text-left font-medium">Type</th>
                            <th className="px-6 py-3 text-right font-medium">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {items.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                                    No usage records found for this period.
                                </td>
                            </tr>
                        ) : (
                            items.map((item) => (
                                <tr key={item.id} className="hover:bg-secondary/30 transition-colors">
                                    <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                                        {new Date(item.createdAt).toLocaleDateString()} <span className="text-xs ml-1">{new Date(item.createdAt).toLocaleTimeString()}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-secondary text-secondary-foreground">
                                                {item.jobId ? <FileVideo className="size-4" /> : <Plus className="size-4" />}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{item.description}</span>
                                                {item.jobId && <span className="text-xs text-muted-foreground font-mono">Job: {item.jobId.slice(0, 8)}</span>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={cn(
                                            "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
                                            "bg-secondary text-secondary-foreground"
                                        )}>
                                            {item.reason}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right whitespace-nowrap">
                                        <div className="font-bold flex items-center justify-end gap-1">
                                            {item.amount > 0 ? (
                                                <>
                                                    <span className="text-destructive">-{item.quantity.toFixed(1)}</span>
                                                    <span className="text-destructive text-xs">min</span>
                                                </>

                                            ) : (
                                                <>
                                                    <span className="text-emerald-600">+{Math.abs(item.quantity).toFixed(1)}</span>
                                                    <span className="text-emerald-600 text-xs">min</span>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
