-- Migration: Add captions and transcription status to Assets
-- Allows subtitles to be stored directly on the asset.

-- 1. Add transcription_status column
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transcription_status') THEN
        CREATE TYPE public.transcription_status AS ENUM ('idle', 'transcribing', 'completed', 'failed');
    END IF;
END $$;

ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS transcription_status public.transcription_status DEFAULT 'idle';

-- 2. Add captions column (JSONB)
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS captions jsonb;

COMMENT ON COLUMN public.assets.transcription_status IS 'Status of the AI transcription process for this asset';
COMMENT ON COLUMN public.assets.captions IS 'Generated/edited captions for this asset (format: CaptionData)';
