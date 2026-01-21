"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { PageContainer } from "@/components/PageContainer";
import { ArrowLeft, Play, Settings } from "lucide-react";
import Link from "next/link";

type QueueRow = {
  id: string;
  name?: string | null;
  created_at?: string | null;
};

type DraftJob = {
  id: string;
  asset?: { filename?: string | null } | null;
  asset_id?: string | null;
};

export default function QueueDetailPage() {
  const params = useParams();
  const projectId = params.id as string;
  const queueId = params.queueId as string;

  const [queue, setQueue] = useState<QueueRow | null>(null);
  const [drafts, setDrafts] = useState<DraftJob[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQueueData = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/queues/${queueId}`);
      if (res.ok) {
        const data = await res.json();
        setQueue(data.queue);
        setDrafts(data.drafts || []);
      }
    } catch (error) {
      console.error("Failed to fetch queue:", error);
    } finally {
      setLoading(false);
    }
  }, [projectId, queueId]);

  useEffect(() => {
    fetchQueueData();
  }, [fetchQueueData]);

  const handleRunAll = async () => {
    // TODO: Implement run all functionality
    console.log("Running all jobs in queue");
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="animate-pulse">Loading queue...</div>
      </PageContainer>
    );
  }

  if (!queue) {
    return (
      <PageContainer>
        <div className="text-center text-muted-foreground">Queue not found</div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="flex items-center gap-4 mb-6">
        <Link
          href={`/projects/${projectId}/dashboard`}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{queue.name ?? "Untitled Queue"}</h1>
          <p className="text-sm text-muted-foreground">{drafts.length} items waiting</p>
        </div>
        <div className="ml-auto flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-muted">
            <Settings className="size-4" />
            Options
          </button>
          <button
            onClick={handleRunAll}
            disabled={drafts.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50"
          >
            <Play className="size-4" />
            Run All
          </button>
        </div>
      </div>

      <div className="border rounded-xl bg-card">
        <div className="p-4 border-b font-medium">Drafts</div>
        {drafts.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No drafts in this queue. Add files from the dashboard.
          </div>
        ) : (
          <div className="divide-y">
            {drafts.map((job) => (
              <div key={job.id} className="p-4 flex items-center justify-between hover:bg-muted/50">
                <div>
                  <div className="font-medium text-sm">{job.asset?.filename ?? job.asset_id ?? job.id}</div>
                  <div className="text-xs text-muted-foreground">Options configured</div>
                </div>
                <div className="text-xs px-2 py-1 bg-gray-100 rounded">Draft</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
