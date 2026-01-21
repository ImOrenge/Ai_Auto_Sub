-- Add 'draft' status to jobs table constraint
-- This allows jobs to be created in draft state before being queued
-- Includes all legacy status values for backwards compatibility

ALTER TABLE public.jobs 
DROP CONSTRAINT IF EXISTS jobs_status_check;

ALTER TABLE public.jobs 
ADD CONSTRAINT jobs_status_check CHECK (
    status IN (
        'draft', 
        'pending', 
        'downloading', 
        'processing', 
        'stt', 
        'translating', 
        'subtitle', 
        'done', 
        'error', 
        'queued', 
        'running', 
        'succeeded', 
        'failed', 
        'canceled'
    )
);
