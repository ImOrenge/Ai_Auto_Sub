"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageContainer } from "@/components/PageContainer";
import { UploadStudio } from "@/components/dashboard/UploadStudio";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { QueueStatusCard } from "@/components/dashboard/QueueStatusCard";
import { CreateQueueModal } from "@/components/dashboard/CreateQueueModal";
import { AddToQueueDialog } from "@/components/dashboard/AddToQueueDialog";
import { Button } from "@/components/ui/button";
import { QueueRecord } from "@/lib/queues/types";
import { AssetRecord } from "@/lib/assets/types";
import { Project } from "@/lib/projects/types";
import { JobRecord, JobStatus } from "@/lib/jobs/types";
import { mapProject } from "@/lib/projects/mapper";

export default function ProjectDashboardPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.id as string;

    const [project, setProject] = useState<Project | null>(null);
    const [assets, setAssets] = useState<AssetRecord[]>([]);
    const [queues, setQueues] = useState<QueueRecord[]>([]);
    const [uploadingProgress, setUploadingProgress] = useState<Record<string, number>>({});
    const [fileCache, setFileCache] = useState<Record<string, File>>({});
    const [localThumbnails, setLocalThumbnails] = useState<Record<string, string>>({});

    // Modals
    const [isCreateQueueOpen, setIsCreateQueueOpen] = useState(false);
    const [isAddToQueueOpen, setIsAddToQueueOpen] = useState(false);
    const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);

    const [error, setError] = useState<string | null>(null);

    // Real pipeline jobs from API
    const [pipelineJobs, setPipelineJobs] = useState<JobRecord[]>([]);


    // 1. Fetch Project Details
    useEffect(() => {
        console.log("Current Project ID from params:", projectId);

        if (!projectId || projectId === 'undefined') {
            console.warn("Invalid Project ID detected:", projectId);
            setError("Invalid project ID");
            return;
        }
        fetch(`/api/projects/${projectId}`)
            .then(async res => {
                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || 'Failed to fetch project');
                }
                return res.json();
            })
            .then(data => {
                setProject(mapProject(data));
            })
            .catch(err => {
                console.error(err);
                setError(err.message);
            });
    }, [projectId]);

    // 2. Load Assets
    const loadAssets = useCallback(async () => {
        if (!projectId || projectId === 'undefined') return;
        try {
            const res = await fetch(`/api/projects/${projectId}/assets?limit=10`); // Limit to recent
            const data = await res.json();
            if (data.assets) {
                // Map from DB (snake_case) to AssetRecord (camelCase)
                const { mapAsset } = await import('@/lib/assets/mapper');
                setAssets(data.assets.map(mapAsset));
            }
        } catch (e) {
            console.error(e);
        }
    }, [projectId]);

    // Fetch queues using the new client pattern (inline for now)
    useEffect(() => {
        if (!projectId || projectId === 'undefined') return;

        import('@/lib/supabase/client').then(({ createClient }) => {
            const supabase = createClient();
            supabase.from('queues').select('*').eq('project_id', projectId).order('created_at', { ascending: false })
                .then(({ data, error }) => { // Removed Type Assertion
                    if (data) setQueues(data as any);
                });
        });
        loadAssets();
    }, [projectId, loadAssets]);

    // 3. Load Pipeline Jobs with Polling
    useEffect(() => {
        if (!projectId || projectId === 'undefined') return;

        const fetchPipelineJobs = async () => {
            try {
                const res = await fetch(`/api/jobs?projectId=${projectId}&limit=20`);
                const data = await res.json();
                if (data.jobs) {
                    setPipelineJobs(data.jobs);
                }
            } catch (e) {
                console.error('Failed to fetch pipeline jobs:', e);
            }
        };

        fetchPipelineJobs();
        const interval = setInterval(fetchPipelineJobs, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, [projectId]);


    // Unified Upload Logic
    const uploadFile = async (file: File, assetId: string) => {
        try {
            // Updated status to uploading
            setAssets(prev => prev.map(a => a.id === assetId ? { ...a, status: 'uploading' } : a));

            // 1. Get Session
            const sessionRes = await fetch('/api/uploads/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filename: file.name,
                    sizeBytes: file.size,
                    mimeType: file.type || 'video/mp4',
                    projectId: projectId
                })
            });

            if (!sessionRes.ok) throw new Error("Upload session failed");
            const { asset, signedUrl } = await sessionRes.json();
            const realId = asset.id;

            // Update ID from temp to real if needed (only for new uploads)
            // If retrying, assetId might already be real, but for simplicity we rely on map by temp ID if it exists?
            // Actually, for retry, we have the real ID. For new upload, we have temp ID.
            // But the server returns the Real ID.

            // We need to handle the ID switch carefully.
            // If it's a retry, we keep the ID.
            // If it's new, we swap temp for real.

            // Simple approach: The server creates a NEW asset record every session request currently.
            // Ideally for TUS we resume. For XHR simple upload, creating new asset is standard behavior for "new attempt".
            // So we update the UI to track the NEW real ID.

            setAssets(prev => prev.map(a => a.id === assetId ? { ...asset, status: 'uploading' } : a));

            // Update cache to point to new realId if it changed (so retry works on the new ID)
            if (assetId !== realId) {
                setFileCache(prev => {
                    const f = prev[assetId];
                    if (!f) return prev;
                    const next: Record<string, File> = { ...prev, [realId]: f };
                    delete next[assetId];
                    return next;
                });
                // Migrate thumbnail too
                setLocalThumbnails(prev => {
                    const t = prev[assetId];
                    if (!t) return prev;
                    const next: Record<string, string> = { ...prev, [realId]: t };
                    delete next[assetId];
                    return next;
                });
            }

            // 2. Upload
            await new Promise<void>((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('PUT', signedUrl);
                xhr.upload.onprogress = (e) => {
                    if (e.lengthComputable) {
                        const percent = (e.loaded / e.total) * 100;
                        setUploadingProgress(prev => ({ ...prev, [realId]: percent }));
                    }
                };
                xhr.onload = () => xhr.status >= 200 ? resolve() : reject(new Error('Upload failed'));
                xhr.onerror = () => reject(new Error('Network error'));
                xhr.send(file);
            });

            // 3. Complete
            const completeRes = await fetch('/api/uploads/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assetId: realId })
            });
            if (!completeRes.ok) {
                const payload = await completeRes.json().catch(() => ({}));
                throw new Error(payload.error || 'Failed to complete upload');
            }

            // Optimistic update to 'uploaded' BEFORE clearing progress to prevent 0% flash
            setAssets(prev => prev.map(a => a.id === realId ? { ...a, status: 'uploaded' } : a));

            setUploadingProgress(prev => {
                const next: Record<string, number> = { ...prev };
                delete next[realId];
                return next;
            });

            // Cleanup cache on success (optional, or keep for re-upload?)
            // setFileCache(prev => { const n = {...prev}; delete n[realId]; return n; }); 

            loadAssets();

        } catch (e) {
            console.error("Upload failed", e);
            setAssets(prev => prev.map(a => a.id === assetId ? { ...a, status: 'failed' } : a)); // Explicit failed status
        }
    };

    // Upload Handler (Integrated with UploadStudio)
    const handleUploadStart = async (files: File[]) => {
        const newOptimisticAssets: AssetRecord[] = [];

        // Pre-process files
        for (const file of files) {
            const tempId = `temp-${Date.now()}-${file.name}-${Math.random().toString(36).substr(2, 9)}`;

            // Generate Local Thumbnail
            const objectUrl = URL.createObjectURL(file);
            setLocalThumbnails(prev => ({ ...prev, [tempId]: objectUrl }));

            // Cache File
            setFileCache(prev => ({ ...prev, [tempId]: file }));

            newOptimisticAssets.push({
                id: tempId,
                userId: "me",
                projectId: projectId,
                filename: file.name,
                storageKey: "",
                status: 'uploading',
                meta: { size: file.size },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });
        }

        setAssets(prev => [...newOptimisticAssets, ...prev]);

        // Start Uploads
        newOptimisticAssets.forEach(asset => {
            const file = files.find(f => f.name === asset.filename); // Simple match
            if (file) uploadFile(file, asset.id);
        });
    };

    const handleRetry = (jobId: string) => {
        const file = fileCache[jobId];
        if (file) {
            uploadFile(file, jobId);
        } else {
            alert("파일을 찾을 수 없습니다. 다시 선택해주세요.");
        }
    };

    // Compute in-progress upload jobs from assets for display
    const uploadingJobs: JobRecord[] = assets
        .filter(asset => asset.status === 'uploading' || (asset.status === 'failed' && fileCache[asset.id]))
        .map(asset => ({
            id: asset.id,
            userId: asset.userId,
            projectId: asset.projectId,
            assetId: asset.id,
            asset: {
                filename: asset.filename,
                thumbnailUrl: localThumbnails[asset.id] || asset.meta?.thumbnailUrl
            },
            url: '',
            sourceType: 'upload',
            status: (asset.status === 'uploading' ? 'uploading' : 'error') as JobStatus,
            progress: uploadingProgress[asset.id] || 0,
            step: 'upload',
            resultSrtUrl: null,
            resultVideoUrl: null,
            errorMessage: asset.status === 'failed' ? 'Upload Failed' : null,
            subtitleConfig: null,
            captionSource: null,
            captionEdit: null,
            editedAt: null,
            createdAt: asset.createdAt,
            updatedAt: asset.updatedAt,
        } as JobRecord));

    // Merge uploading jobs with pipeline jobs (pipeline jobs take precedence by ID)
    const pipelineJobIds = new Set(pipelineJobs.map(j => j.id));
    const recentJobs: JobRecord[] = [
        ...uploadingJobs.filter(j => !pipelineJobIds.has(j.id)),
        ...pipelineJobs
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 20);

    if (error) {
        return (
            <PageContainer className="gap-8 py-8">
                <div className="p-8 flex flex-col items-center justify-center min-h-[50vh] text-center">
                    <div className="text-red-500 font-semibold mb-2">Error Loading Project</div>
                    <p className="text-muted-foreground mb-4">{error}</p>
                    <button
                        onClick={() => router.push('/projects')}
                        className="text-blue-600 hover:underline"
                    >
                        Return to Projects
                    </button>
                </div>
            </PageContainer>
        );
    }

    if (!project) {
        return <div className="p-8 flex items-center justify-center min-h-[50vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
    }

    return (
        <PageContainer className="gap-8 py-8 pb-32 max-w-7xl mx-auto">
            {/* 1. Header with Project Switcher & Chips (Simplified for now) */}
            <header className="flex flex-col gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">Project</span>
                    <span>/</span>
                    <span className="font-semibold text-foreground">{project.name}</span>
                </div>
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold tracking-tight">Studio</h1>
                    {/* Placeholder for future Project Switcher */}
                </div>
            </header>

            {/* 2. Upload Studio (Main Area) */}
            <section className="w-full">
                <UploadStudio
                    onUploadStart={handleUploadStart}
                    onCreateQueue={() => setIsCreateQueueOpen(true)}
                    onOpenDrafts={() => {/* TODO: Open last draft queue */ }}
                />
            </section>

            {/* 3. Dashboard Grid (Recent & Queues) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">

                {/* Left: Recent Activity (2/3 width on large) */}
                <section className="lg:col-span-2 space-y-4">
                    <RecentActivity
                        jobs={recentJobs}
                        onJobClick={(id) => { /* Preview or Select */ }}
                        onRetry={handleRetry}
                        selectedJobIds={selectedJobIds}
                        onSelectionChange={setSelectedJobIds}
                    />
                </section>

                {/* Right: My Queues (1/3 width) */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-lg font-semibold">My Queues</h3>
                        <button
                            onClick={() => setIsCreateQueueOpen(true)}
                            className="text-sm text-blue-600 font-medium hover:underline"
                        >
                            + New
                        </button>
                    </div>

                    <div className="space-y-4">
                        {queues.length === 0 ? (
                            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-dashed border-gray-200 dark:border-gray-800 text-center text-gray-500 text-sm">
                                No queues yet. Create one to start working.
                            </div>
                        ) : (
                            queues.map(queue => (
                                <QueueStatusCard
                                    key={queue.id}
                                    queue={{ ...queue, draftCount: 0, runningCount: 0 }} // Mock counts for now
                                    projectId={projectId}
                                />
                            ))
                        )}
                    </div>
                </section>
            </div>

            <CreateQueueModal
                isOpen={isCreateQueueOpen}
                onClose={() => setIsCreateQueueOpen(false)}
                projectId={projectId}
                onQueueCreated={(newQueue) => {
                    // Reload queues
                    import('@/lib/supabase/client').then(({ createClient }) => {
                        createClient().from('queues').select('*').eq('project_id', projectId).order('created_at', { ascending: false })
                            .then(({ data }) => { if (data) setQueues(data as any); });
                    });
                }}
            />

            <AddToQueueDialog
                isOpen={isAddToQueueOpen}
                onClose={() => setIsAddToQueueOpen(false)}
                projectId={projectId}
                selectedJobIds={selectedJobIds}
                onSuccess={() => {
                    setSelectedJobIds([]);
                    // Reload queues to show updated counts if needed
                    import('@/lib/supabase/client').then(({ createClient }) => {
                        createClient().from('queues').select('*').eq('project_id', projectId).order('created_at', { ascending: false })
                            .then(({ data }) => { if (data) setQueues(data as any); });
                    });
                }}
            />

            {/* Floating Action Bar */}
            {selectedJobIds.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl rounded-full px-6 py-3 flex items-center gap-4 animate-in slide-in-from-bottom-4">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {selectedJobIds.length} items selected
                    </span>
                    <div className="h-4 w-px bg-gray-200 dark:bg-gray-700"></div>
                    <Button
                        size="sm"
                        onClick={() => setIsAddToQueueOpen(true)}
                        className="rounded-full"
                    >
                        Add to Queue
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedJobIds([])}
                        className="rounded-full text-gray-500 hover:text-gray-900"
                    >
                        Cancel
                    </Button>
                </div>
            )}
        </PageContainer>
    );
}
