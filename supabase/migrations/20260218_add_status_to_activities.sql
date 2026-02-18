-- Add status column to activities table
-- Allows marking activities as completed, pending, or cancelled

ALTER TABLE activities
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending'
CHECK (status IN ('pending', 'completed', 'cancelled'));

-- Update existing activities to have pending status
UPDATE activities SET status = 'pending' WHERE status IS NULL;
