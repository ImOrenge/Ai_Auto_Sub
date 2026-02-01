-- Migration: Add Plan Benefit Columns and Resolution Limits
-- This migration adds missing columns to the jobs table and updates plan configurations.

-- 1. Add missing columns to jobs table
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS priority text DEFAULT 'standard' CHECK (priority IN ('standard', 'priority', 'highest'));
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS export_settings jsonb DEFAULT null;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS cost numeric DEFAULT 0;

COMMENT ON COLUMN public.jobs.priority IS 'Queue priority level for this job (standard, priority, highest)';
COMMENT ON COLUMN public.jobs.export_settings IS 'Metadata about resolutions, codecs, and render settings used for output';
COMMENT ON COLUMN public.jobs.cost IS 'Total credits consumed by this job (processing + export)';

-- 2. Update plans table with exportResolutionLimit
-- Starter: HD
-- Pro: FHD
-- Plus: UHD
-- Max: UHD

UPDATE public.plans SET limits = limits || '{"exportResolutionLimit": "hd"}'::jsonb WHERE id = 'starter';
UPDATE public.plans SET limits = limits || '{"exportResolutionLimit": "fhd"}'::jsonb WHERE id = 'pro';
UPDATE public.plans SET limits = limits || '{"exportResolutionLimit": "uhd"}'::jsonb WHERE id = 'plus';
UPDATE public.plans SET limits = limits || '{"exportResolutionLimit": "uhd"}'::jsonb WHERE id = 'max';

-- 3. Ensure priority_fee is in the metric check constraint (already in migration 230000, but good to ensure)
ALTER TABLE public.usage_ledger DROP CONSTRAINT IF EXISTS usage_ledger_metric_check;
ALTER TABLE public.usage_ledger ADD CONSTRAINT usage_ledger_metric_check CHECK (metric IN ('processing_credits', 'export_credits', 'priority_fee'));
