-- Migration: Add sequence column to jobs table
-- This column stores the multi-clip sequence data in JSONB format.

ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS sequence JSONB;

COMMENT ON COLUMN public.jobs.sequence IS '에디터의 멀티 클립 시퀀스 정보 (JSONB array)';
