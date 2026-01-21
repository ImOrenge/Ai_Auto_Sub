"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import {
    Activity,
    AlertCircle,
    CheckCircle2,
    Loader2,
    RefreshCcw,
    Search,
    MoreHorizontal
} from "lucide-react";
import { PageContainer } from "@/components/PageContainer";
import { cn } from "@/lib/utils";
import { JobRecord } from "@/lib/jobs/types";
import { JobTable } from "@/components/jobs/JobTable";
import { JobDetailDrawer } from "@/components/jobs/JobDetailDrawer";
import { JobBulkActionBar } from "@/components/jobs/JobBulkActionBar";

// ============================================================================
// Types & Constants
// ============================================================================

type StatusCounts = {
    all: number;
    draft: number;
    pending: number;
    processing: number;
    done: number;
    error: number;
    canceled: number;
};

type FilterStatus = "all" | "draft" | "pending" | "processing" | "done" | "error" | "canceled";

const FILTER_PILLS: { key: FilterStatus; label: string; icon: React.ElementType }[] = [
    { key: "all", label: "All", icon: MoreHorizontal },
    { key: "draft", label: "Draft", icon: MoreHorizontal },
    { key: "processing", label: "Running", icon: Activity },
    { key: "done", label: "Completed", icon: CheckCircle2 },
    { key: "error", label: "Failed", icon: AlertCircle },
];

function JobsPageLoading() {
    return (
        <PageContainer className="gap-8 py-10">
            <div className="flex items-center justify-center py-12">
                <Loader2 className="size-8 animate-spin text-primary" />
            </div>
        </PageContainer>
    );
}

export default function ProjectJobsPage() {
    return (
        <Suspense fallback={<JobsPageLoading />}>
            <JobsPageContent />
        </Suspense>
    );
}

function JobsPageContent() {
    const router = useRouter();
    // Get Project ID from path params
    const params = useParams();
    const projectId = params.id as string;

    const searchParams = useSearchParams();

    // Data State
    const [jobs, setJobs] = useState<JobRecord[]>([]);
    const [counts, setCounts] = useState<StatusCounts>({ all: 0, draft: 0, pending: 0, processing: 0, done: 0, error: 0, canceled: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Selection & UI State
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [selectedJob, setSelectedJob] = useState<JobRecord | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [individualActionLoading, setIndividualActionLoading] = useState<string | null>(null);

    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    // Filters
    const activeStatus = (searchParams.get("status") as FilterStatus) || "all";
    const searchQuery = searchParams.get("search") || "";
    const [searchInput, setSearchInput] = useState(searchQuery);

    // Fetching
    const fetchJobs = useCallback(async (options?: { showRefresh?: boolean }) => {
        if (!projectId) return;

        if (options?.showRefresh) setIsRefreshing(true);
        else setIsLoading(true);

        try {
            const params = new URLSearchParams();
            params.set("page", String(page));
            params.set("limit", "20");
            params.set("projectId", projectId); // Filter by Project ID
            if (activeStatus !== "all") params.set("status", activeStatus);
            if (searchQuery) params.set("search", searchQuery);

            const res = await fetch(`/api/jobs?${params.toString()}`, { cache: "no-store" });
            const data = await res.json();

            setJobs(data.jobs || []);
            // setCounts(data.counts || counts); // Project-specific counts might need update in API response
            // The API response returns 'counts' if hasFilters is true (which is true if projectId is set)
            if (data.counts) setCounts(data.counts);

            setTotalPages(data.totalPages || 1);
            setTotal(data.total || 0);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [page, activeStatus, searchQuery, projectId]);

    useEffect(() => {
        if (projectId) {
            fetchJobs();
            const interval = setInterval(() => fetchJobs({ showRefresh: false }), 5000);
            return () => clearInterval(interval);
        }
    }, [fetchJobs, projectId]);

    // Handlers
    const handleToggleSelect = (id: string, shiftKey: boolean) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(new Set(jobs.map(j => j.id)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleBulkAction = async (action: 'cancel' | 'retry' | 'delete') => {
        if (selectedIds.size === 0) return;
        setActionLoading(action);

        try {
            await fetch('/api/jobs/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action,
                    jobIds: Array.from(selectedIds)
                })
            });
            await fetchJobs({ showRefresh: true });
            setSelectedIds(new Set());
        } catch (e) {
            alert("Bulk action failed");
        } finally {
            setActionLoading(null);
        }
    };

    const updateFilters = (updates: any) => {
        const params = new URLSearchParams(searchParams.toString());
        if (updates.status) updates.status === 'all' ? params.delete('status') : params.set('status', updates.status);
        if (updates.search !== undefined) updates.search === '' ? params.delete('search') : params.set('search', updates.search);
        setPage(1);
        router.push(`/projects/${projectId}/jobs?${params.toString()}`);
    };

    // Individual Job Actions
    const handleJobRetry = async (jobId: string) => {
        setIndividualActionLoading(jobId);
        try {
            const res = await fetch(`/api/jobs/${jobId}/retry`, { method: 'POST' });
            if (!res.ok) throw new Error('Retry failed');
            await fetchJobs({ showRefresh: true });
        } catch (e) {
            alert('Failed to retry job');
        } finally {
            setIndividualActionLoading(null);
        }
    };

    const handleJobCancel = async (jobId: string) => {
        setIndividualActionLoading(jobId);
        try {
            const res = await fetch(`/api/jobs/${jobId}/cancel`, { method: 'POST' });
            if (!res.ok) throw new Error('Cancel failed');
            await fetchJobs({ showRefresh: true });
        } catch (e) {
            alert('Failed to cancel job');
        } finally {
            setIndividualActionLoading(null);
        }
    };

    const handleJobDelete = async (jobId: string) => {
        setIndividualActionLoading(jobId);
        try {
            const res = await fetch(`/api/jobs/${jobId}/delete`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Delete failed');
            await fetchJobs({ showRefresh: true });
        } catch (e) {
            alert('Failed to delete job');
        } finally {
            setIndividualActionLoading(null);
        }
    };

    const handleJobExport = async (jobId: string) => {
        setIndividualActionLoading(jobId);
        try {
            const res = await fetch(`/api/jobs/${jobId}/export`, { method: 'POST' });
            if (!res.ok) throw new Error('Export failed');
            const data = await res.json();
            if (data.downloadUrl) {
                window.open(data.downloadUrl, '_blank');
            }
        } catch (e) {
            alert('Failed to export job');
        } finally {
            setIndividualActionLoading(null);
        }
    };

    const handleJobStart = async (jobId: string) => {
        setIndividualActionLoading(jobId);
        try {
            const res = await fetch(`/api/jobs/${jobId}/start`, { method: 'POST' });
            if (!res.ok) throw new Error('Start failed');
            await fetchJobs({ showRefresh: true });
        } catch (e) {
            alert('Failed to start job');
        } finally {
            setIndividualActionLoading(null);
        }
    };

    return (
        <PageContainer className="gap-6 py-8 pb-32">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight">Project Jobs</h1>
                    <p className="text-sm text-muted-foreground">Manage jobs for this project.</p>
                </div>
                <div className="flex items-center gap-2">
                    <form onSubmit={(e) => { e.preventDefault(); updateFilters({ search: searchInput }); }} className="relative">
                        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <input className="pl-9 pr-4 py-2 rounded-full border bg-background text-sm w-[200px] focus:w-[300px] transition-all"
                            placeholder="Search ID or URL..."
                            value={searchInput}
                            onChange={e => setSearchInput(e.target.value)}
                        />
                    </form>
                    <button onClick={() => fetchJobs({ showRefresh: true })} className="p-2 rounded-full hover:bg-muted border">
                        <RefreshCcw className={cn("size-4", isRefreshing && "animate-spin")} />
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {FILTER_PILLS.map(pill => {
                    const Icon = pill.icon;
                    const active = activeStatus === pill.key;
                    return (
                        <button
                            key={pill.key}
                            onClick={() => updateFilters({ status: pill.key })}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-colors",
                                active ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-secondary"
                            )}
                        >
                            <Icon className="size-4" />
                            {pill.label}
                            {/* Counts might be global unless API returns filtered counts. 
                                Assuming API returns filtered counts because we passed projectId */}
                            {active && <span className="ml-1 rounded-full bg-primary-foreground/20 px-2 py-0.5 text-xs">{counts[pill.key] || 0}</span>}
                        </button>
                    )
                })}
            </div>

            {/* Table */}
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden min-h-[400px]">
                {isLoading && !isRefreshing && jobs.length === 0 ? (
                    <div className="flex items-center justify-center h-[400px]">
                        <Loader2 className="size-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <JobTable
                        jobs={jobs}
                        selectedIds={selectedIds}
                        onToggleSelect={handleToggleSelect}
                        onSelectAll={handleSelectAll}
                        onViewMsg={(job) => setSelectedJob(job)}
                        onRetry={handleJobRetry}
                        onCancel={handleJobCancel}
                        onDelete={handleJobDelete}
                        onExport={handleJobExport}
                        onStart={handleJobStart}
                        actionLoading={individualActionLoading}
                    />
                )}
            </div>

            {/* Pagination (Simplified) */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
                <p>Showing {(page - 1) * 20 + 1}-{Math.min(page * 20, total)} of {total}</p>
                <div className="flex gap-2">
                    <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 rounded border hover:bg-secondary disabled:opacity-50">Prev</button>
                    <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 rounded border hover:bg-secondary disabled:opacity-50">Next</button>
                </div>
            </div>

            {/* Overlays */}
            <JobBulkActionBar
                selectedCount={selectedIds.size}
                onClearSelection={() => setSelectedIds(new Set())}
                onRetry={() => handleBulkAction('retry')}
                onCancel={() => handleBulkAction('cancel')}
                onDelete={() => handleBulkAction('delete')}
                loadingAction={actionLoading}
            />

            <JobDetailDrawer
                job={selectedJob}
                onClose={() => setSelectedJob(null)}
                projectId={projectId}
            />

        </PageContainer>
    );
}
