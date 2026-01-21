-- Add queue settings and status columns
-- This enables auto-run, pause/resume, and priority modes

-- Add auto_run flag
ALTER TABLE queues 
ADD COLUMN IF NOT EXISTS auto_run BOOLEAN DEFAULT FALSE;

-- Add priority mode
ALTER TABLE queues 
ADD COLUMN IF NOT EXISTS priority_mode TEXT DEFAULT 'fifo';

-- Add queue status
ALTER TABLE queues 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Add constraints
ALTER TABLE queues 
DROP CONSTRAINT IF EXISTS queues_priority_mode_check;

ALTER TABLE queues 
ADD CONSTRAINT queues_priority_mode_check 
CHECK (priority_mode IN ('fifo', 'manual', 'priority'));

ALTER TABLE queues 
DROP CONSTRAINT IF EXISTS queues_status_check;

ALTER TABLE queues 
ADD CONSTRAINT queues_status_check 
CHECK (status IN ('active', 'paused'));

-- Comments for documentation
COMMENT ON COLUMN queues.auto_run IS 'Automatically start queue when drafts are added';
COMMENT ON COLUMN queues.priority_mode IS 'How jobs are ordered: fifo, manual, or priority-based';
COMMENT ON COLUMN queues.status IS 'Queue execution status: active or paused';
