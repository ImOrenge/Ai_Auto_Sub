-- Migration: Add URL support to Assets
-- Allows assets to be created from external URLs (YouTube, direct links, etc.)

-- 1. Add source_url column
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS source_url text;

-- 2. Make storage_key nullable (since URL assets don't have a local file yet)
ALTER TABLE public.assets ALTER COLUMN storage_key DROP NOT NULL;

-- 3. Add 'downloading' to asset_status enum
-- Note: In Postgres, adding a value to an enum used in a table requires workarounds or just using text.
-- Since it's already an enum 'public.asset_status', let's use ALTER TYPE.
ALTER TYPE public.asset_status ADD VALUE IF NOT EXISTS 'downloading';

COMMENT ON COLUMN public.assets.source_url IS 'External source URL for the media (YouTube, etc.)';
