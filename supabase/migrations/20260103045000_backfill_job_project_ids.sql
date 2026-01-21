-- Migration: Backfill NULL project_ids in jobs table
-- This ensures all existing jobs have proper project association

-- Step 1: Backfill project_id from queue relationship
UPDATE jobs
SET project_id = (
    SELECT project_id 
    FROM queues 
    WHERE queues.id = jobs.queue_id
)
WHERE project_id IS NULL 
  AND queue_id IS NOT NULL;

-- Step 2: For any remaining NULL project_ids (orphaned jobs with no queue),
-- we could either delete them or assign to a default project.
-- For safety, we'll just log them for manual review.
-- Uncomment the following if you want to delete orphaned jobs:
-- DELETE FROM jobs WHERE project_id IS NULL;

-- Step 3: Add index to improve query performance for project-scoped queries
CREATE INDEX IF NOT EXISTS idx_jobs_project_id_status 
ON jobs(project_id, status);

-- Step 4 (Optional): Add NOT NULL constraint to enforce data integrity going forward
-- CAUTION: Only enable this if you're confident all jobs will have project_id
-- ALTER TABLE jobs 
--   ALTER COLUMN project_id SET NOT NULL;

-- Verification query (run this manually to check results):
-- SELECT 
--   COUNT(*) FILTER (WHERE project_id IS NULL) as null_project_count,
--   COUNT(*) FILTER (WHERE project_id IS NOT NULL) as valid_project_count,
--   COUNT(*) as total
-- FROM jobs;
