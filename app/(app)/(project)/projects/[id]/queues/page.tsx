"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageContainer } from "@/components/PageContainer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Play, RefreshCw } from "lucide-react";

type QueueRow = {
  id: string;
  name?: string | null;
  created_at?: string | null;
};

type DraftJob = {
  id: string;
  asset?: { filename?: string | null } | null;
  asset_id?: string | null;
  options?: Record<string, unknown>;
};

type DraftQueue = {
  id: string;
  name: string;
  createdAt?: string | null;
  jobs: DraftJob[];
};

export default function ProjectQueuePage() {
  const params = useParams();
  const projectId = params.id as string;

  const [queues, setQueues] = useState<DraftQueue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [runningQueueIds, setRunningQueueIds] = useState<Record<string, boolean>>({});

  const fetchDraftQueues = useCallback(async () => {
    if (!projectId || projectId === "undefined") {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const queueRes = await fetch(`/api/projects/${projectId}/queues`);
      if (!queueRes.ok) {
        const payload = await queueRes.json().catch(() => ({}));
        throw new Error(payload.error || "Failed to load queues");
      }

      const queuePayload = await queueRes.json();
      const queueRows = Array.isArray(queuePayload.queues)
        ? (queuePayload.queues as QueueRow[])
        : [];

      const queuesWithDrafts = await Promise.all(
        queueRows.map(async (queue) => {
          try {
            const jobsRes = await fetch(`/api/queue/${queue.id}/jobs`);
            if (!jobsRes.ok) {
              return {
                id: queue.id,
                name: queue.name ?? "Untitled Queue",
                createdAt: queue.created_at ?? null,
                jobs: [],
              };
            }

            const jobsPayload = await jobsRes.json();
            const jobs = Array.isArray(jobsPayload.jobs)
              ? (jobsPayload.jobs as DraftJob[])
              : [];

            return {
              id: queue.id,
              name: queue.name ?? "Untitled Queue",
              createdAt: queue.created_at ?? null,
              jobs,
            };
          } catch (jobError) {
            console.error(jobError);
            return {
              id: queue.id,
              name: queue.name ?? "Untitled Queue",
              createdAt: queue.created_at ?? null,
              jobs: [],
            };
          }
        })
      );

      setQueues(queuesWithDrafts);
    } catch (fetchError) {
      const message =
        fetchError instanceof Error ? fetchError.message : "Failed to load queues";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchDraftQueues();
  }, [fetchDraftQueues]);

  const handleRunQueue = async (queue: DraftQueue) => {
    if (queue.jobs.length === 0) return;
    setRunningQueueIds((prev) => ({ ...prev, [queue.id]: true }));

    try {
      const res = await fetch(`/api/queue/${queue.id}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobIds: queue.jobs.map((job) => job.id) }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || "Failed to start draft flow");
      }

      await fetchDraftQueues();
    } catch (runError) {
      const message =
        runError instanceof Error ? runError.message : "Failed to start draft flow";
      setError(message);
    } finally {
      setRunningQueueIds((prev) => ({ ...prev, [queue.id]: false }));
    }
  };

  return (
    <PageContainer className="gap-6 py-8">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Queue</h1>
            <p className="text-sm text-muted-foreground">
              Draft queues ready for STT &gt; Translation &gt; SRT.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDraftQueues}
            disabled={loading}
            className="gap-2"
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            Refresh
          </Button>
        </div>
      </header>

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[240px] items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : queues.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card p-10 text-center text-sm text-muted-foreground">
          No draft queues yet. Add assets to a queue to start the flow.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {queues.map((queue) => {
            const isRunning = !!runningQueueIds[queue.id];

            return (
              <Card key={queue.id} className="h-full">
                <CardHeader className="border-b">
                  <CardTitle className="text-lg">{queue.name}</CardTitle>
                  <CardDescription>
                    {queue.jobs.length} draft job{queue.jobs.length === 1 ? "" : "s"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {queue.jobs.slice(0, 4).map((job) => (
                    <div
                      key={job.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">
                          {job.asset?.filename ?? job.asset_id ?? job.id}
                        </p>
                        <p className="text-xs text-muted-foreground">Draft</p>
                      </div>
                    </div>
                  ))}
                  {queue.jobs.length > 4 && (
                    <div className="text-xs text-muted-foreground">
                      +{queue.jobs.length - 4} more draft jobs
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex flex-wrap gap-2 border-t">
                  <Button
                    className="flex-1 gap-2"
                    onClick={() => handleRunQueue(queue)}
                    disabled={isRunning || queue.jobs.length === 0}
                  >
                    {isRunning ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Play className="size-4" />
                    )}
                    Run STT &gt; Translation &gt; SRT
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/projects/${projectId}/queues/${queue.id}`}>
                      Open queue
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}
