-- Add missing status values for pipeline processing
-- Adds: uploading, preprocessing, awaiting_edit

ALTER TABLE public.jobs 
DROP CONSTRAINT IF EXISTS jobs_status_check;

ALTER TABLE public.jobs 
ADD CONSTRAINT jobs_status_check CHECK (
    status IN (
        'draft',
        'pending',
        'queued',
        'running',
        'uploading',
        'downloading',
        'preprocessing',
        'processing',
        'stt',
        'translating',
        'subtitle',
        'awaiting_edit',
        'exporting',
        'done',
        'succeeded',
        'failed',
        'error',
        'canceled'
    )
);
