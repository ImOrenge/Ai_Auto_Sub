-- Add cuts column to jobs table
ALTER TABLE jobs ADD COLUMN cuts JSONB;

-- Set default cuts (whole video) for existing jobs (optional, but good for consistency)
-- For now, we'll leave it as NULL which the app handles as 'no cuts' (whole video).
