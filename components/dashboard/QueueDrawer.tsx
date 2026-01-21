"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { X, Play, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { JobRecord } from "@/lib/queues/types";

type QueueDrawerProps = {
    isOpen: boolean;
    onClose: () => void;
    queueId?: string;
    className?: string;
};

export function QueueDrawer({ isOpen, onClose, queueId, className }: QueueDrawerProps) {
    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [running, setRunning] = useState(false);

    const fetchJobs = async () => {
        if (!queueId) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/queue/${queueId}/jobs`);
            if (res.ok) {
                const data = await res.json();
                setJobs(data.jobs || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && queueId) {
            fetchJobs();
        }
    }, [isOpen, queueId]);

    const handleRunAll = async () => {
        if (!queueId || jobs.length === 0) return;
        setRunning(true);
        try {
            const jobIds = jobs.map(j => j.id);
            const res = await fetch(`/api/queue/${queueId}/run`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ jobIds }),
            });

            if (res.ok) {
                // Refresh or close
                // Maybe show toast?
                onClose();
                // Trigger a global refresh or something
            }
        } catch (e) {
            console.error(e);
        } finally {
            setRunning(false);
        }
    };

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity"
                    onClick={onClose}
                />
            )}

            {/* Drawer Panel */}
            <div
                className={cn(
                    "fixed inset-y-0 right-0 z-50 w-full max-w-sm border-l bg-background shadow-2xl transition-transform duration-300 ease-in-out sm:max-w-md",
                    isOpen ? "translate-x-0" : "translate-x-full",
                    className
                )}
            >
                <div className="flex h-full flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b p-4">
                        <div>
                            <h2 className="text-lg font-semibold">작업 대기열</h2>
                            <p className="text-sm text-muted-foreground">{jobs.length}개의 작업이 대기 중입니다.</p>
                        </div>
                        <button onClick={onClose} className="rounded-full p-2 hover:bg-muted">
                            <X className="size-5" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="size-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : jobs.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <p>큐가 비어있습니다.</p>
                            </div>
                        ) : (
                            jobs.map((job) => (
                                <div key={job.id} className="rounded-xl border bg-card p-3 shadow-sm flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">{job.asset?.filename || "Unknown Asset"}</p>
                                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                            <span className="uppercase">{job.asset?.status}</span>
                                            <span>• {job.options?.sourceLang || 'Auto'}</span>
                                        </div>
                                    </div>
                                    <button className="text-muted-foreground hover:text-destructive">
                                        <Trash2 className="size-4" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <div className="border-t p-4 space-y-3 bg-muted/10">
                        {/* Bulk Options (Simplified) */}
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>일괄 설정: 기본값 적용됨</span>
                            <button className="text-primary hover:underline">변경</button>
                        </div>

                        <button
                            onClick={handleRunAll}
                            disabled={running || jobs.length === 0}
                            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                            {running ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
                            {jobs.length}개 작업 실행하기
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
