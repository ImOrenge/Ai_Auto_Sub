"use client";

import { useState } from "react";
import Link from "next/link";
import { JobRecord } from "@/lib/jobs/types";
import { CheckCircle2, Clock, AlertCircle, Loader2, XCircle, MoreHorizontal, ExternalLink, Play, PlayCircle, MoreVertical, RotateCcw, Trash2, Download, Edit2 } from "lucide-react";
import { cn } from "@/lib/utils";

type JobTableProps = {
    jobs: JobRecord[];
    selectedIds: Set<string>;
    onToggleSelect: (id: string, shiftKey: boolean) => void;
    onSelectAll: (checked: boolean) => void;
    onViewMsg: (job: JobRecord) => void;
    // Individual action handlers
    onRetry?: (jobId: string) => Promise<void>;
    onCancel?: (jobId: string) => Promise<void>;
    onDelete?: (jobId: string) => Promise<void>;
    onExport?: (jobId: string) => Promise<void>;
    onStart?: (jobId: string) => Promise<void>;
    actionLoading?: string | null; // Job ID currently being acted upon
};


export function JobTable({ jobs, selectedIds, onToggleSelect, onSelectAll, onViewMsg, onRetry, onCancel, onDelete, onExport, onStart, actionLoading }: JobTableProps) {
    const isAllSelected = jobs.length > 0 && selectedIds.size === jobs.length;
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    // Status Badge Component
    const StatusBadge = ({ status }: { status: string }) => {
        let color = "bg-secondary text-secondary-foreground";
        let Icon = Clock;
        const processingStatuses = [
            "queued",
            "running",
            "downloading",
            "processing",
            "stt",
            "transcribing",
            "translating",
            "subtitle",
            "uploading",
            "preprocessing",
            "compositing",
            "exporting",
        ];

        if (["done", "succeeded"].includes(status)) {
            color = "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
            Icon = CheckCircle2;
        } else if (["error", "failed"].includes(status)) {
            color = "bg-destructive/15 text-destructive";
            Icon = AlertCircle;
        } else if (["canceled"].includes(status)) {
            color = "bg-muted text-muted-foreground";
            Icon = XCircle;
        } else if (processingStatuses.includes(status)) {
            color = "bg-primary/10 text-primary";
            Icon = Loader2;
        }

        return (
            <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium", color)}>
                <Icon className={cn("size-3.5", processingStatuses.includes(status) && "animate-spin")} />
                <span className="capitalize">{status.replace(/_/g, " ")}</span>
            </span>
        );
    };

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-sm">
                <thead className="bg-muted/40">
                    <tr>
                        <th className="px-4 py-3 w-[40px]">
                            <input
                                type="checkbox"
                                className="rounded border-gray-300"
                                checked={isAllSelected}
                                onChange={(e) => onSelectAll(e.target.checked)}
                            />
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[300px]">Asset / Job ID</th>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Progress</th>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Created</th>
                        <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {jobs.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="text-center py-12 text-muted-foreground">
                                No jobs found.
                            </td>
                        </tr>
                    ) : (
                        jobs.map((job) => (
                            <tr key={job.id} className={cn("group transition hover:bg-secondary/30", selectedIds.has(job.id) && "bg-primary/5")}>
                                <td className="px-4 py-3">
                                    <input
                                        type="checkbox"
                                        className="rounded border-gray-300"
                                        checked={selectedIds.has(job.id)}
                                        onChange={(e) => onToggleSelect(job.id, (e.nativeEvent as any).shiftKey)}
                                    />
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-col">
                                        <span className="font-medium truncate max-w-[280px]" title={job.asset?.filename || job.url}>
                                            {job.asset?.filename || job.url}
                                        </span>
                                        <span className="text-xs text-muted-foreground font-mono">{job.id.slice(0, 8)}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <StatusBadge status={job.status} />
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2 w-24">
                                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary transition-all duration-500"
                                                style={{ width: `${(job.progress || 0) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-muted-foreground text-xs">
                                    {new Date(job.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => onViewMsg(job)}
                                            className="p-1.5 hover:bg-secondary rounded-md text-muted-foreground hover:text-foreground transition"
                                            title="View Details"
                                        >
                                            <PlayCircle className="size-4" />
                                        </button>

                                        {/* Job Action Dropdown Menu */}
                                        <div className="relative">
                                            <button
                                                onClick={() => setOpenMenuId(openMenuId === job.id ? null : job.id)}
                                                className="p-1.5 hover:bg-secondary rounded-md text-muted-foreground hover:text-foreground transition"
                                                disabled={actionLoading === job.id}
                                                title="Actions"
                                            >
                                                {actionLoading === job.id ? (
                                                    <Loader2 className="size-4 animate-spin" />
                                                ) : (
                                                    <MoreVertical className="size-4" />
                                                )}
                                            </button>

                                            {/* Dropdown Menu */}
                                            {openMenuId === job.id && (
                                                <>
                                                    {/* Backdrop */}
                                                    <div
                                                        className="fixed inset-0 z-10"
                                                        onClick={() => setOpenMenuId(null)}
                                                    />

                                                    {/* Menu */}
                                                    <div className="absolute right-0 top-full mt-1 z-20 min-w-[160px] rounded-lg border bg-card shadow-lg py-1">
                                                        {/* Start (for draft/queued jobs) */}
                                                        {(job.status as string) === 'draft' && onStart && (
                                                            <button
                                                                onClick={async () => {
                                                                    setOpenMenuId(null);
                                                                    await onStart(job.id);
                                                                }}
                                                                className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-secondary transition text-left">
                                                                <Play className="size-4 text-emerald-600" />
                                                                <span>Start</span>
                                                            </button>
                                                        )}

                                                        {/* Retry (for failed/error/canceled jobs) */}
                                                        {['error', 'failed', 'canceled'].includes(job.status) && onRetry && (
                                                            <button
                                                                onClick={async () => {
                                                                    setOpenMenuId(null);
                                                                    await onRetry(job.id);
                                                                }}
                                                                className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-secondary transition text-left">
                                                                <RotateCcw className="size-4 text-primary" />
                                                                <span>Retry</span>
                                                            </button>
                                                        )}

                                                        {/* Cancel (for running jobs) */}
                                                        {['queued', 'pending', 'processing', 'running', 'downloading', 'stt', 'transcribing', 'translating', 'subtitle', 'uploading', 'preprocessing', 'compositing', 'exporting'].includes(job.status) && onCancel && (
                                                            <button
                                                                onClick={async () => {
                                                                    setOpenMenuId(null);
                                                                    await onCancel(job.id);
                                                                }}
                                                                className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-secondary transition text-left">
                                                                <XCircle className="size-4 text-orange-600" />
                                                                <span>Cancel</span>
                                                            </button>
                                                        )}

                                                        {/* Edit (for done/awaiting_edit jobs) */}
                                                        {['done', 'awaiting_edit'].includes(job.status) && (
                                                            <Link
                                                                href={`/jobs/${job.id}/edit`}
                                                                onClick={() => setOpenMenuId(null)}
                                                                className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-secondary transition">
                                                                <Edit2 className="size-4 text-primary" />
                                                                <span>Edit</span>
                                                            </Link>
                                                        )}

                                                        {/* Export (for done jobs) */}
                                                        {job.status === 'done' && onExport && (
                                                            <button
                                                                onClick={async () => {
                                                                    setOpenMenuId(null);
                                                                    await onExport(job.id);
                                                                }}
                                                                className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-secondary transition text-left">
                                                                <Download className="size-4 text-emerald-600" />
                                                                <span>Export</span>
                                                            </button>
                                                        )}

                                                        {/* Delete (for all non-processing jobs) */}
                                                        {!['processing', 'running', 'downloading', 'stt', 'transcribing', 'translating', 'subtitle', 'uploading', 'preprocessing', 'compositing', 'exporting'].includes(job.status) && onDelete && (
                                                            <>
                                                                <div className="my-1 border-t border-border" />
                                                                <button
                                                                    onClick={async () => {
                                                                        if (confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
                                                                            setOpenMenuId(null);
                                                                            await onDelete(job.id);
                                                                        }
                                                                    }}
                                                                    className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-destructive/10 text-destructive transition text-left">
                                                                    <Trash2 className="size-4" />
                                                                    <span>Delete</span>
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
