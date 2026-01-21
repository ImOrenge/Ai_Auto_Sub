export type QueueRecord = {
  id: string;
  userId: string;
  projectId?: string;
  name: string;
  language?: string;
  defaultOptions: Record<string, any>;
  createdAt: string;
  updatedAt: string;
};

export type JobRecord = {
  id: string;
  userId: string;
  projectId?: string;
  assetId: string;
  queueId?: string;
  queuePosition?: number;
  status: 'draft' | 'pending' | 'queued' | 'running' | 'succeeded' | 'failed' | 'canceled';
  options: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}; // Using a simplified definition here, real one should align with lib/jobs/types if possible, or extend/replace it.
