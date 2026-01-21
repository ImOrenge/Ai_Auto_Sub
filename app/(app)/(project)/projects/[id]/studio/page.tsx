"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { StudioTopBar } from "@/components/studio/StudioTopBar";
import { UploadStudio } from "@/components/dashboard/UploadStudio";
import { AssetGrid } from "@/components/dashboard/AssetGrid";
import { CreateQueueModal } from "@/components/dashboard/CreateQueueModal"; // Import Modal
import { QueueSettingsModal } from "@/components/queues/QueueSettingsModal";
import { AssetRecord } from "@/lib/assets/types";
import { Project } from "@/lib/projects/types";
import { createClient } from "@/lib/supabase/client";

interface StudioPageProps {
    params: Promise<{ id: string }>;
}

export default function StudioPage() {
    const params = useParams();
    const projectId = params.id as string;
    const [project, setProject] = useState<Project | null>(null);
    const [allProjects, setAllProjects] = useState<Project[]>([]);

    // State for Assets/Drafts
    const [assets, setAssets] = useState<AssetRecord[]>([]);
    const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(new Set());
    const [uploadingProgress, setUploadingProgress] = useState<Record<string, number>>({});

    // State for Queues
    const [queues, setQueues] = useState<any[]>([]);
    const [selectedQueueId, setSelectedQueueId] = useState<string | null>(null);
    const [isAddingToQueue, setIsAddingToQueue] = useState(false);

    // State for Errors
    const [error, setError] = useState<string | null>(null);
    const [loadingError, setLoadingError] = useState<string | null>(null);

    // State for Queue Actions
    const [runningQueues, setRunningQueues] = useState<Set<string>>(new Set());
    const [queueStats, setQueueStats] = useState<Record<string, { draft: number; running: number; completed: number }>>({});
    const [notification, setNotification] = useState<string | null>(null);
    const prevQueueStats = useRef<Record<string, { draft: number; running: number; completed: number }>>({});

    // State for Run Confirmation
    const [showRunConfirm, setShowRunConfirm] = useState(false);
    const [selectedQueueForRun, setSelectedQueueForRun] = useState<{ id: string; name: string; draftCount: number } | null>(null);
    const [estimatedCost, setEstimatedCost] = useState(0);
    const [userPlan, setUserPlan] = useState<'free' | 'pro' | 'enterprise'>('free');

    // State for Queue Settings
    const [showQueueSettings, setShowQueueSettings] = useState(false);
    const [selectedQueueForSettings, setSelectedQueueForSettings] = useState<any | null>(null);

    // State for Queue Modal
    const [isCreateQueueModalOpen, setIsCreateQueueModalOpen] = useState(false);

    // Fetch project data and assets
    useEffect(() => {
        async function fetchData() {
            const supabase = createClient();

            // Fetch current project
            const { data: projectData } = await supabase
                .from("projects")
                .select("*")
                .eq("id", projectId)
                .single();

            if (projectData) {
                const mappedProject: Project = {
                    ...projectData,
                    userId: projectData.user_id,
                    isArchived: projectData.is_archived,
                    createdAt: projectData.created_at,
                    updatedAt: projectData.updated_at
                } as unknown as Project;
                setProject(mappedProject);
            }
            // Fetch all projects for switcher
            const { data: allProjectsData } = await supabase
                .from("projects")
                .select("*")
                .order("created_at", { ascending: false });

            if (allProjectsData) {
                const mappedAllProjects: Project[] = allProjectsData.map((p: any) => ({
                    ...p,
                    userId: p.user_id,
                    isArchived: p.is_archived,
                    createdAt: p.created_at,
                    updatedAt: p.updated_at
                }));
                setAllProjects(mappedAllProjects);
            }

            // Fetch assets
            try {
                const res = await fetch(`/api/assets?projectId=${projectId}&limit=50`);
                if (res.ok) {
                    const data = await res.json();
                    setAssets(data.assets);
                }
            } catch (err) {
                console.error("Failed to fetch assets", err);
            }

            // Fetch queues
            try {
                const res = await fetch(`/api/projects/${projectId}/queues`);
                if (res.ok) {
                    const data = await res.json();
                    setQueues(data.queues || []);
                    // Auto-select first queue if available
                    if (data.queues?.length > 0 && !selectedQueueId) {
                        setSelectedQueueId(data.queues[0].id);
                    }
                    // Fetch draft counts for each queue
                    await fetchQueueStats(data.queues || []);
                }
            } catch (err) {
                console.error("Failed to fetch queues", err);
                setLoadingError(err instanceof Error ? err.message : "Failed to load queues");
            }
        }

        fetchData();
    }, [projectId]);

    // Supabase Realtime subscription (replaces polling)
    useEffect(() => {
        if (!projectId || queues.length === 0) return;

        const supabase = createClient();

        // Subscribe to job status changes for this project
        const channel = supabase
            .channel(`project-${projectId}-jobs`)
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
                    schema: 'public',
                    table: 'jobs',
                    filter: `project_id=eq.${projectId}`,
                },
                (payload) => {
                    console.log('[Realtime] Job change detected:', payload);
                    // Refresh queue stats when any job changes
                    fetchQueueStats(queues);
                }
            )
            .subscribe((status) => {
                console.log('[Realtime] Subscription status:', status);
            });

        // Cleanup on unmount
        return () => {
            console.log('[Realtime] Unsubscribing from channel');
            supabase.removeChannel(channel);
        };
    }, [projectId, queues]);

    // Fallback polling (reduced frequency - every 10 seconds)
    // This runs as backup in case Realtime fails
    useEffect(() => {
        if (queues.length === 0) return;

        const interval = setInterval(async () => {
            console.log('[Polling] Fallback refresh');
            await fetchQueueStats(queues);
        }, 10000); // 10 seconds instead of 3

        return () => clearInterval(interval);
    }, [queues, projectId]);

    // Check for completed queues and show notifications
    useEffect(() => {
        Object.entries(queueStats).forEach(([queueId, stats]) => {
            const prevStats = prevQueueStats.current[queueId];
            if (prevStats && prevStats.running > 0 && stats.running === 0 && stats.draft === 0) {
                const queue = queues.find(q => q.id === queueId);
                const queueName = queue?.name || 'Queue';
                setNotification(`All jobs in "${queueName}" completed!`);
                setTimeout(() => setNotification(null), 5000);
            }
        });
        prevQueueStats.current = queueStats;
    }, [queueStats, queues]);

    const handleUploadStart = async (files: File[]) => {
        const supabase = createClient();

        // Optimistic UI update
        const tempAssets: AssetRecord[] = files.map(file => ({
            id: Math.random().toString(36).substring(7),
            filename: file.name,
            original_filename: file.name,
            size: file.size,
            mimeType: file.type, // Map directly to what logic expects if needed, or stick to AssetRecord
            status: 'uploading',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            projectId: projectId,
            storageKey: '',
            userId: '', // Placeholder
            meta: {
                size: file.size,
                type: file.type
            }
        } as unknown as AssetRecord));

        setAssets(prev => [...tempAssets, ...prev]);

        // Process uploads
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const tempId = tempAssets[i].id;

            try {
                const path = `projects/${projectId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

                // 1. Upload to Supabase Storage
                // Use a simulated progress for better UX since Supabase client doesn't expose progress easily in await
                setUploadingProgress(prev => ({ ...prev, [tempId]: 10 }));

                const { error: uploadError } = await supabase.storage
                    .from('uploads')
                    .upload(path, file, {
                        cacheControl: '3600',
                        upsert: false
                    });

                if (uploadError) throw uploadError;

                setUploadingProgress(prev => ({ ...prev, [tempId]: 50 }));

                // 2. Create Asset Record
                const res = await fetch('/api/assets', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        projectId,
                        filename: file.name,
                        storageKey: path,
                        meta: { size: file.size, mimeType: file.type }
                    })
                });

                if (!res.ok) throw new Error("Failed to register asset");

                const newAsset = await res.json();

                // 3. Update state with real asset
                setAssets(current => current.map(a =>
                    a.id === tempId ? newAsset : a
                ));
                setUploadingProgress(prev => {
                    const next = { ...prev };
                    delete next[tempId];
                    return next;
                });

            } catch (error) {
                console.error(`Upload failed for ${file.name}:`, error);
                setAssets(current => current.map(a =>
                    a.id === tempId ? { ...a, status: 'failed', errorMessage: 'Upload failed' } : a
                ));
                setUploadingProgress(prev => {
                    const next = { ...prev };
                    delete next[tempId];
                    return next;
                });
            }
        }
    };

    const handleUrlUpload = async (url: string) => {
        try {
            const res = await fetch('/api/assets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId,
                    sourceUrl: url,
                })
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to add URL');
            }

            const newAsset = await res.json();
            setAssets(prev => [newAsset, ...prev]);
            setNotification(`Successfully added: ${newAsset.filename}`);
            setTimeout(() => setNotification(null), 3000);
        } catch (err) {
            console.error("URL upload failed:", err);
            setError(err instanceof Error ? err.message : "Failed to add URL");
        }
    };

    const handleToggleSelect = (id: string) => {
        const newSelected = new Set(selectedAssetIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedAssetIds(newSelected);
    };

    const handleQueueCreated = async (queue: any) => {
        // Refresh queues list
        try {
            const res = await fetch(`/api/projects/${projectId}/queues`);
            if (res.ok) {
                const data = await res.json();
                setQueues(data.queues || []);
                // Auto-select the newly created queue
                setSelectedQueueId(queue.id);
            }
        } catch (err) {
            console.error("Failed to refresh queues", err);
        }
        setIsCreateQueueModalOpen(false);
    };

    const handleAddToQueue = async () => {
        if (!selectedQueueId || selectedAssetIds.size === 0) {
            alert('Please select assets and a queue');
            return;
        }

        setIsAddingToQueue(true);
        setError(null);

        try {
            const assetIds = Array.from(selectedAssetIds);

            const response = await fetch(`/api/queue/${selectedQueueId}/jobs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assetIds })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to add to queue');
            }

            const result = await response.json();
            alert(`✅ Added ${assetIds.length} asset(s) to queue`);

            // Clear selection
            setSelectedAssetIds(new Set());

            // Refresh queue stats
            await fetchQueueStats(queues);

            // Check if auto-run is enabled for this queue
            const currentQueue = queues.find(q => q.id === selectedQueueId);
            if (currentQueue?.auto_run) {
                console.log(`[Auto-run] Queue "${currentQueue.name}" has auto-run enabled, triggering automatically...`);

                // Small delay to ensure stats are updated
                setTimeout(() => {
                    handleRunQueue(selectedQueueId);
                }, 500);
            }
        } catch (error) {
            console.error('Failed to add to queue:', error);
            setError(error instanceof Error ? error.message : 'Failed to add to queue');
            alert(error instanceof Error ? error.message : 'Failed to add to queue');
        } finally {
            setIsAddingToQueue(false);
        }
    };

    const fetchQueueStats = async (queueList: any[]) => {
        const stats: Record<string, { draft: number; running: number; completed: number }> = {};

        await Promise.all(queueList.map(async (queue) => {
            try {
                // Fetch draft jobs
                const draftsRes = await fetch(`/api/queue/${queue.id}/jobs`);
                if (draftsRes.ok) {
                    const draftsData = await draftsRes.json();
                    const draftCount = (draftsData.jobs || []).filter((j: any) => j.status === 'draft').length;

                    // Fetch running jobs (use jobs API with queueId filter)
                    let runningCount = 0;
                    let completedCount = 0;

                    if (projectId) {
                        const runningRes = await fetch(`/api/jobs?projectId=${projectId}&status=running&queueId=${queue.id}`);
                        if (runningRes.ok) {
                            const runningData = await runningRes.json();
                            runningCount = runningData.jobs?.length || 0;
                        }

                        // Fetch completed jobs (today only for progress calculation)
                        const today = new Date().toISOString().split('T')[0];
                        const completedRes = await fetch(
                            `/api/jobs?projectId=${projectId}&queueId=${queue.id}&startDate=${today}`
                        );
                        if (completedRes.ok) {
                            const completedData = await completedRes.json();
                            const allJobs = completedData.jobs || [];
                            completedCount = allJobs.filter((j: any) =>
                                j.status === 'succeeded' || j.status === 'failed' || j.status === 'done'
                            ).length;
                        }
                    }

                    stats[queue.id] = { draft: draftCount, running: runningCount, completed: completedCount };
                } else {
                    stats[queue.id] = { draft: 0, running: 0, completed: 0 };
                }
            } catch (err) {
                console.error(`Failed to fetch stats for queue ${queue.id}`, err);
                stats[queue.id] = { draft: 0, running: 0, completed: 0 };
            }
        }));

        setQueueStats(stats);
    };

    const handleRunQueue = async (queueId: string) => {
        const stats = queueStats[queueId];
        if (!stats || stats.draft === 0) {
            alert('No draft jobs in this queue');
            return;
        }

        const queue = queues.find(q => q.id === queueId);
        const queueName = queue?.name || 'Queue';

        // Calculate estimated cost
        // For now, hardcode 'free' plan - will be fetched from API later
        const plan = 'free';
        const costPerJob = plan === 'free' ? 0.10 : plan === 'pro' ? 0.05 : 0.03;
        const cost = stats.draft * costPerJob;

        // Show confirmation dialog with cost estimation
        setSelectedQueueForRun({ id: queueId, name: queueName, draftCount: stats.draft });
        setEstimatedCost(cost);
        setUserPlan(plan);
        setShowRunConfirm(true);
    };

    const confirmRunQueue = async () => {
        if (!selectedQueueForRun) return;

        const queueId = selectedQueueForRun.id;
        setShowRunConfirm(false);
        setRunningQueues(prev => new Set(prev).add(queueId));

        try {
            // Get draft jobs
            const draftsRes = await fetch(`/api/queue/${queueId}/jobs`);
            if (!draftsRes.ok) throw new Error('Failed to fetch draft jobs');

            const draftsData = await draftsRes.json();
            const jobIds = (draftsData.jobs || []).map((j: any) => j.id);

            // Trigger run
            const runRes = await fetch(`/api/queue/${queueId}/run`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jobIds })
            });

            if (!runRes.ok) {
                const errorData = await runRes.json();

                // Handle usage limit error
                if (errorData.upgradeRequired) {
                    alert(`❌ ${errorData.error}\n\nYour plan: ${errorData.plan?.toUpperCase()}\nCurrent usage: ${errorData.currentUsage || 0}\n\nPlease upgrade to continue.`);
                    throw new Error(errorData.error);
                }

                throw new Error(errorData.error || 'Failed to run queue');
            }

            const result = await runRes.json();
            alert(`✅ Started processing ${jobIds.length} job(s) in "${selectedQueueForRun.name}"\n\nPlan: ${result.plan?.toUpperCase()}\nConcurrency: ${result.concurrency}`);

            // Refresh stats
            await fetchQueueStats(queues);
        } catch (error) {
            console.error('Failed to run queue:', error);
            const message = error instanceof Error ? error.message : 'Failed to run queue';
            alert(message);
        } finally {
            setRunningQueues(prev => {
                const next = new Set(prev);
                next.delete(queueId);
                return next;
            });
            setSelectedQueueForRun(null);
        }
    };

    const cancelRunQueue = () => {
        setShowRunConfirm(false);
        setSelectedQueueForRun(null);
    };

    const handleQueueSettings = (queue: any) => {
        setSelectedQueueForSettings(queue);
        setShowQueueSettings(true);
    };

    const handleSaveQueueSettings = async (settings: { name: string; auto_run: boolean; priority_mode: string }) => {
        if (!selectedQueueForSettings) return;

        try {
            const res = await fetch(`/api/queue/${selectedQueueForSettings.id}/settings`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to save settings');
            }

            // Refresh queues
            const supabase = createClient();
            const { data: updatedQueues } = await supabase
                .from('queues')
                .select('*')
                .eq('project_id', projectId)
                .order('created_at', { ascending: false });

            if (updatedQueues) {
                setQueues(updatedQueues);
            }

            setShowQueueSettings(false);
            setSelectedQueueForSettings(null);
        } catch (error) {
            console.error('Failed to save queue settings:', error);
            alert(error instanceof Error ? error.message : 'Failed to save settings');
        }
    };

    const handlePauseQueue = async (queueId: string) => {
        try {
            const res = await fetch(`/api/queue/${queueId}/pause`, {
                method: 'POST'
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to pause queue');
            }

            const result = await res.json();
            alert(`⏸ Paused queue. ${result.jobsReverted} job(s) reverted to draft.`);

            // Refresh queues and stats
            const supabase = createClient();
            const { data: updatedQueues } = await supabase
                .from('queues')
                .select('*')
                .eq('project_id', projectId)
                .order('created_at', { ascending: false });

            if (updatedQueues) {
                setQueues(updatedQueues);
                await fetchQueueStats(updatedQueues);
            }
        } catch (error) {
            console.error('Failed to pause queue:', error);
            alert(error instanceof Error ? error.message : 'Failed to pause queue');
        }
    };

    const handleResumeQueue = async (queueId: string) => {
        const queue = queues.find(q => q.id === queueId);
        const queueName = queue?.name || 'Queue';

        try {
            const res = await fetch(`/api/queue/${queueId}/resume`, {
                method: 'POST'
            });

            if (!res.ok) {
                const errorData = await res.json();

                if (errorData.upgradeRequired) {
                    alert(`❌ ${errorData.error}\n\nYour plan: ${errorData.plan?.toUpperCase()}\nCurrent usage: ${errorData.currentUsage || 0}\n\nPlease upgrade to continue.`);
                    return;
                }

                throw new Error(errorData.error || 'Failed to resume queue');
            }

            const result = await res.json();
            alert(`▶️ Resumed "${queueName}". Processing ${result.count} job(s).\n\nPlan: ${result.plan?.toUpperCase()}\nConcurrency: ${result.concurrency}`);

            // Refresh queues and stats
            const supabase = createClient();
            const { data: updatedQueues } = await supabase
                .from('queues')
                .select('*')
                .eq('project_id', projectId)
                .order('created_at', { ascending: false });

            if (updatedQueues) {
                setQueues(updatedQueues);
                await fetchQueueStats(updatedQueues);
            }
        } catch (error) {
            console.error('Failed to resume queue:', error);
            alert(error instanceof Error ? error.message : 'Failed to resume queue');
        }
    };

    if (!project) {
        if (loadingError) {
            return (
                <div className="p-8">
                    <div className="text-center">
                        <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Studio</h2>
                        <p className="text-gray-600 dark:text-gray-400">{loadingError}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            );
        }
        return <div className="p-8">Loading...</div>;
    }

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
            <div className="px-6 py-4">
                <StudioTopBar
                    project={project}
                    allProjects={allProjects}
                    onUploadClick={() => document.getElementById('studio-upload-trigger')?.click()}
                    onNewQueueClick={() => setIsCreateQueueModalOpen(true)}
                />
            </div>

            <div className="flex-1 p-6 overflow-y-auto bg-gray-50/30 dark:bg-black/20">
                {/* Success Notification */}
                {notification && (
                    <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 animate-in slide-in-from-top">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium">{notification}</span>
                    </div>
                )}

                {/* Error Banner */}
                {error && (
                    <div className="max-w-6xl mx-auto mb-4">
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
                            <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <div className="flex-1">
                                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
                                <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
                            </div>
                            <button
                                onClick={() => setError(null)}
                                className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}

                <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 pb-20">
                    {/* Main Content - Left Column (2/3 width) */}
                    <div className="lg:col-span-2 space-y-6">
                        <section>
                            <UploadStudio
                                onUploadStart={handleUploadStart}
                                onUrlUpload={handleUrlUpload}
                                onCreateQueue={() => setIsCreateQueueModalOpen(true)}
                                onOpenDrafts={() => { }} // Could scroll to grid
                            />
                        </section>

                        {/* Queue Empty State */}
                        {queues.length === 0 && (
                            <section>
                                <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-12 text-center">
                                    <div className="max-w-sm mx-auto">
                                        <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                        </svg>
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Queues Yet</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                                            Create your first queue to organize and process your uploaded assets.
                                        </p>
                                        <button
                                            onClick={() => setIsCreateQueueModalOpen(true)}
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-500 transition-colors"
                                        >
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                                            </svg>
                                            Create First Queue
                                        </button>
                                    </div>
                                </div>
                            </section>
                        )}

                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                    Drafts
                                    <span className="text-sm font-normal text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                                        {assets.length}
                                    </span>
                                </h2>
                                {selectedAssetIds.size > 0 && (
                                    <div className="flex items-center gap-2">
                                        <select
                                            value={selectedQueueId || ''}
                                            onChange={e => setSelectedQueueId(e.target.value)}
                                            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"
                                            disabled={queues.length === 0}
                                        >
                                            {queues.length === 0 ? (
                                                <option value="">No queues available</option>
                                            ) : (
                                                queues.map(q => (
                                                    <option key={q.id} value={q.id}>
                                                        {q.name || 'Untitled Queue'}
                                                    </option>
                                                ))
                                            )}
                                        </select>
                                        <button
                                            onClick={handleAddToQueue}
                                            disabled={!selectedQueueId || isAddingToQueue || queues.length === 0}
                                            className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {isAddingToQueue ? 'Adding...' : `Add ${selectedAssetIds.size} to Queue`}
                                        </button>
                                        {queues.length === 0 && (
                                            <button
                                                onClick={() => setIsCreateQueueModalOpen(true)}
                                                className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
                                            >
                                                Create Queue
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            <AssetGrid
                                assets={assets}
                                selectedIds={selectedAssetIds}
                                onToggleSelect={handleToggleSelect}
                                uploadingProgress={uploadingProgress}
                            />
                        </section>
                    </div>

                    {/* Queue Panel - Right Column (1/3 width) */}
                    <aside className="lg:col-span-1">
                        <div className="sticky top-6">
                            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                                <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                                    <h3 className="font-semibold text-gray-900 dark:text-white">Queues</h3>
                                    <button
                                        onClick={() => setIsCreateQueueModalOpen(true)}
                                        className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                        title="Create new queue"
                                    >
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="divide-y divide-gray-200 dark:divide-gray-800">
                                    {queues.length === 0 ? (
                                        <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
                                            No queues yet
                                        </div>
                                    ) : (
                                        queues.map(queue => {
                                            const stats = queueStats[queue.id] || { draft: 0, running: 0, completed: 0 };
                                            const isRunning = runningQueues.has(queue.id);

                                            // Calculate progress
                                            const total = stats.draft + stats.running + stats.completed;
                                            const progress = total > 0 ? (stats.completed / total) * 100 : 0;
                                            const remaining = stats.draft + stats.running;
                                            const estimatedMinutes = remaining * 5; // Estimate 5 min per job

                                            return (
                                                <div key={queue.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="font-medium text-gray-900 dark:text-white truncate">
                                                                {queue.name || 'Untitled Queue'}
                                                            </h4>
                                                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                                <span className="flex items-center gap-1">
                                                                    <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                                                                    {stats.draft} draft{stats.draft !== 1 ? 's' : ''}
                                                                </span>
                                                                {stats.running > 0 && (
                                                                    <span className="flex items-center gap-1">
                                                                        <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                                                                        {stats.running} running
                                                                    </span>
                                                                )}
                                                                {stats.completed > 0 && (
                                                                    <span className="flex items-center gap-1">
                                                                        <span className="w-2 h-2 rounded-full bg-green-400"></span>
                                                                        {stats.completed} done
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {/* Settings Button */}
                                                        <button
                                                            onClick={() => handleQueueSettings(queue)}
                                                            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                                                            title="Queue settings"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            </svg>
                                                        </button>
                                                    </div>

                                                    {/* Progress Bar */}
                                                    {total > 0 && (
                                                        <div className="mt-3 mb-2">
                                                            <div className="flex items-center gap-2 text-xs">
                                                                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                                                                    <div
                                                                        className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-300"
                                                                        style={{ width: `${progress}%` }}
                                                                    />
                                                                </div>
                                                                <span className="text-gray-500 dark:text-gray-400 min-w-[3rem] text-right">
                                                                    {stats.completed}/{total}
                                                                </span>
                                                            </div>
                                                            {estimatedMinutes > 0 && (
                                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                                                                    ~{estimatedMinutes} min remaining
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}

                                                    <div className="flex items-center gap-2 mt-3">
                                                        {/* Pause/Resume buttons */}
                                                        {queue.status === 'paused' ? (
                                                            <button
                                                                onClick={() => handleResumeQueue(queue.id)}
                                                                disabled={stats.draft === 0}
                                                                className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                            >
                                                                ▶️ Resume
                                                            </button>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    onClick={() => handleRunQueue(queue.id)}
                                                                    disabled={isRunning || stats.draft === 0}
                                                                    className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                                                                    {isRunning ? (
                                                                        <span className="flex items-center justify-center gap-1">
                                                                            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                            </svg>
                                                                            Running...
                                                                        </span>
                                                                    ) : (
                                                                        'Run Queue'
                                                                    )}
                                                                </button>
                                                                {isRunning && (
                                                                    <button
                                                                        onClick={() => handlePauseQueue(queue.id)}
                                                                        className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                                                    >
                                                                        ⏸ Pause
                                                                    </button>
                                                                )}
                                                            </>
                                                        )}
                                                        <a
                                                            href={`/projects/${projectId}/queues/${queue.id}`}
                                                            className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                                        >
                                                            View
                                                        </a>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>

            {/* Run Queue Confirmation Modal */}
            {showRunConfirm && selectedQueueForRun && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-900 rounded-xl p-6 max-w-md mx-4 shadow-2xl border border-gray-200 dark:border-gray-800">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Run Queue Confirmation
                        </h3>
                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">Queue:</span>
                                <span className="font-medium text-gray-900 dark:text-white">{selectedQueueForRun.name}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">Jobs to process:</span>
                                <span className="font-medium text-gray-900 dark:text-white">{selectedQueueForRun.draftCount}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">Your plan:</span>
                                <span className="font-medium text-blue-600 dark:text-blue-400 uppercase">{userPlan}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">Concurrency limit:</span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                    {userPlan === 'free' ? '1' : userPlan === 'pro' ? '3' : '5'} concurrent
                                </span>
                            </div>
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                                <div className="flex justify-between text-base font-semibold">
                                    <span className="text-gray-900 dark:text-white">Estimated cost:</span>
                                    <span className="text-green-600 dark:text-green-400">${estimatedCost.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={confirmRunQueue}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-500 transition-colors"
                            >
                                Confirm & Run
                            </button>
                            <button
                                onClick={cancelRunQueue}
                                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Queue Settings Modal */}
            {showQueueSettings && selectedQueueForSettings && (
                <QueueSettingsModal
                    isOpen={showQueueSettings}
                    onClose={() => {
                        setShowQueueSettings(false);
                        setSelectedQueueForSettings(null);
                    }}
                    queue={selectedQueueForSettings}
                    onSave={handleSaveQueueSettings}
                />
            )}

            <CreateQueueModal
                isOpen={isCreateQueueModalOpen}
                onClose={() => setIsCreateQueueModalOpen(false)}
                projectId={projectId}
                onQueueCreated={handleQueueCreated}
            />
        </div>
    );
}

