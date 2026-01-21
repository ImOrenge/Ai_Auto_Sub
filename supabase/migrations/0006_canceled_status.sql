-- Add 'canceled' status to jobs table for user-initiated cancellation
-- This migration updates the CHECK constraint to allow the new status value

-- Drop existing constraint and add updated one with 'canceled' status
ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_status_check;
ALTER TABLE public.jobs ADD CONSTRAINT jobs_status_check CHECK (
  status IN (
    'pending',
    'uploading',
    'preprocessing',
    'downloading',
    'processing',
    'stt',
    'translating',
    'subtitle',
    'compositing',
    'awaiting_edit',
    'editing',
    'ready_to_export',
    'exporting',
    'done',
    'error',
    'canceled'
  )
);

-- Add index for faster status-based filtering (jobs page)
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON public.jobs(user_id);
