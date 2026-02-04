-- Migration: Add priority column to activities table
-- Execute this in Supabase SQL Editor

-- Add priority column with constraint
ALTER TABLE activities 
ADD COLUMN IF NOT EXISTS priority TEXT 
CHECK (priority IN ('low', 'medium', 'high')) 
DEFAULT 'medium';

-- Add comment to document the column
COMMENT ON COLUMN activities.priority IS 'Activity priority level: low, medium, or high';

-- Update existing rows to have default priority
UPDATE activities 
SET priority = 'medium' 
WHERE priority IS NULL;
