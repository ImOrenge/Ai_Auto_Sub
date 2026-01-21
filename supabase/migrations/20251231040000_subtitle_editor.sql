-- Migration: Subtitle Editor Feature
-- Adds new job statuses for editing workflow and caption storage columns

-- 1. Update job status constraint to include editor states
-- First, fix any legacy statuses that don't match the new constraint
UPDATE public.jobs SET status = 'error' WHERE status = 'failed';

ALTER TABLE public.jobs 
DROP CONSTRAINT IF EXISTS jobs_status_check;

ALTER TABLE public.jobs 
ADD CONSTRAINT jobs_status_check CHECK (
  status IN (
    'pending', 'downloading', 'processing', 'stt', 'translating', 
    'subtitle', 'uploading', 'preprocessing', 'compositing',
    'awaiting_edit', 'editing', 'ready_to_export', 'exporting',
    'done', 'error', 'canceled'
  )
);

-- 2. Add caption storage columns
ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS caption_source jsonb,
ADD COLUMN IF NOT EXISTS caption_edit jsonb,
ADD COLUMN IF NOT EXISTS edited_at timestamptz;

COMMENT ON COLUMN public.jobs.caption_source IS 'Original SRT parsed as JSON cues from STT/translation pipeline';
COMMENT ON COLUMN public.jobs.caption_edit IS 'User-edited caption data with cues and style overrides';
COMMENT ON COLUMN public.jobs.edited_at IS 'Timestamp of last edit save';

-- 3. Style presets table for Pro users
CREATE TABLE IF NOT EXISTS public.style_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  config jsonb NOT NULL,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT timezone('utc', now()),
  updated_at timestamptz DEFAULT timezone('utc', now())
);

COMMENT ON TABLE public.style_presets IS 'Saved subtitle style presets for Pro users';

-- Indexes for style presets
CREATE INDEX IF NOT EXISTS idx_style_presets_user_id ON public.style_presets(user_id);
CREATE INDEX IF NOT EXISTS idx_style_presets_is_default ON public.style_presets(is_default) WHERE is_default = true;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.set_style_presets_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  new.updated_at = timezone('utc', now());
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS trg_style_presets_updated_at ON public.style_presets;
CREATE TRIGGER trg_style_presets_updated_at
BEFORE UPDATE ON public.style_presets
FOR EACH ROW EXECUTE PROCEDURE public.set_style_presets_updated_at();
