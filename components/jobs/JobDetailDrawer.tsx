"use client";

import { cn } from "@/lib/utils";
import { X, CheckCircle2, Clock, AlertCircle, Download, FileText, Play, Pencil, ArrowRight } from "lucide-react";
import { JobRecord } from "@/lib/jobs/types";
import Link from "next/link";

type JobDetailDrawerProps = {
    job: JobRecord | null;
    onClose: () => void;
    projectId?: string; // Optional: when provided, use project-context editor route
};

export function JobDetailDrawer({ job, onClose, projectId }: JobDetailDrawerProps) {
    const isOpen = !!job;

    if (!isOpen || !job) return null;

    return (
        <>
            <div
                className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />
            <div
                className={cn(
                    "fixed inset-y-0 right-0 z-50 w-full max-w-lg border-l bg-background shadow-2xl transition-transform duration-300 ease-in-out sm:max-w-xl",
                    isOpen ? "translate-x-0" : "translate-x-full"
                )}
            >
                <div className="flex h-full flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b p-6">
                        <div>
                            <p className="text-xs uppercase text-muted-foreground font-bold tracking-wider mb-1">JOB DETAILS</p>
                            <h2 className="text-xl font-semibold break-all line-clamp-1" title={job.asset?.filename || job.url}>
                                {job.asset?.filename || job.url}
                            </h2>
                            <p className="text-sm text-muted-foreground font-mono mt-1">{job.id}</p>
                        </div>
                        <button onClick={onClose} className="rounded-full p-2 hover:bg-muted">
                            <X className="size-5" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-8">

                        {/* Status Section */}
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                {getStatusIcon(job.status)}
                                <span className="text-lg font-medium capitalize">{job.status.replace(/_/g, " ")}</span>
                            </div>

                            {job.errorMessage && (
                                <div className="rounded-xl bg-destructive/10 p-4 border border-destructive/20 text-destructive text-sm">
                                    <p className="font-semibold mb-1">Error Log</p>
                                    <code className="block whitespace-pre-wrap">{job.errorMessage}</code>
                                </div>
                            )}
                        </section>

                        {/* Usage Info */}
                        <section className="space-y-3">
                            <h3 className="text-sm font-semibold text-muted-foreground">USAGE & COST</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="rounded-lg border p-3">
                                    <p className="text-xs text-muted-foreground">Total Cost</p>
                                    <p className="text-lg font-medium">${job.cost?.toFixed(4) || "0.0000"}</p>
                                </div>
                                <div className="rounded-lg border p-3">
                                    <p className="text-xs text-muted-foreground">Duration</p>
                                    <p className="text-lg font-medium">{job.usageMetrics?.sttMinutes?.toFixed(1) || 0} min</p>
                                </div>
                            </div>
                        </section>

                        {/* Timeline (Simplified) */}
                        <section className="space-y-4">
                            <h3 className="text-sm font-semibold text-muted-foreground">TIMELINE</h3>
                            <div className="relative border-l-2 border-muted pl-4 ml-2 space-y-6">
                                <TimelineItem
                                    date={job.createdAt}
                                    label="Created"
                                    active
                                />
                                <TimelineItem
                                    date={job.createdAt}
                                    label="Started Processing"
                                    active={job.status !== 'pending'}
                                />
                                <TimelineItem
                                    date={job.updatedAt}
                                    label={job.status === 'done' ? 'Completed' : job.status === 'error' ? 'Failed' : 'Last Updated'}
                                    active={['done', 'error', 'canceled'].includes(job.status)}
                                    isLast
                                />
                            </div>
                        </section>

                        {/* Outputs */}
                        {['done', 'awaiting_edit', 'editing', 'ready_to_export'].includes(job.status) && (
                            <section className="space-y-3">
                                <h3 className="text-sm font-semibold text-muted-foreground">OUTPUTS</h3>
                                <div className="flex flex-col gap-2">
                                    {job.resultSrtUrl && (
                                        <a href={job.resultSrtUrl} download className="flex items-center justify-between p-3 rounded-xl border hover:bg-secondary/50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-600">
                                                    <FileText className="size-4" />
                                                </div>
                                                <div className="text-sm">
                                                    <p className="font-medium">Source Captions (SRT)</p>
                                                    <p className="text-xs text-muted-foreground">Original transcription</p>
                                                </div>
                                            </div>
                                            <Download className="size-4 text-muted-foreground" />
                                        </a>
                                    )}
                                    {job.resultVideoUrl && (
                                        <a href={job.resultVideoUrl} download className="flex items-center justify-between p-3 rounded-xl border hover:bg-secondary/50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "p-2 rounded-lg",
                                                    job.status === 'done' ? "bg-blue-500/10 text-blue-600" : "bg-slate-500/10 text-slate-600"
                                                )}>
                                                    <Play className="size-4" />
                                                </div>
                                                <div className="text-sm">
                                                    <p className="font-medium">
                                                        {job.status === 'done' ? "Burned-in Video" : "Source Video (Original)"}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {job.status === 'done'
                                                            ? "Video with subtitles merged"
                                                            : "Uploaded source without subtitles"
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                            <Download className="size-4 text-muted-foreground" />
                                        </a>
                                    )}
                                    <Link
                                        href={projectId
                                            ? `/projects/${projectId}/jobs/${job.id}/edit`
                                            : `/jobs/${job.id}/edit`
                                        }
                                        className="flex items-center justify-between p-3 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-primary/10 rounded-lg text-primary group-hover:bg-primary/20 transition-colors">
                                                <Pencil className="size-4" />
                                            </div>
                                            <div className="text-sm">
                                                <p className="font-medium text-primary">Edit Subtitles</p>
                                                <p className="text-xs text-muted-foreground">Modify timecodes & text</p>
                                            </div>
                                        </div>
                                        <ArrowRight className="size-4 text-primary" />
                                    </Link>
                                </div>
                            </section>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

function TimelineItem({ date, label, active, isLast }: any) {
    return (
        <div className="relative">
            <div className={cn("absolute -left-[21px] size-3 rounded-full border-2 bg-background", active ? "border-primary bg-primary" : "border-muted")} />
            <p className={cn("text-sm font-medium leading-none", active ? "text-foreground" : "text-muted-foreground")}>{label}</p>
            <p className="text-xs text-muted-foreground mt-1">{new Date(date).toLocaleString()}</p>
        </div>
    )
}

function getStatusIcon(status: string) {
    if (['done', 'succeeded'].includes(status)) return <CheckCircle2 className="size-6 text-emerald-500" />;
    if (['error', 'failed'].includes(status)) return <AlertCircle className="size-6 text-destructive" />;
    if (['pending'].includes(status)) return <Clock className="size-6 text-muted-foreground" />;
    return <div className="size-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />;
}
