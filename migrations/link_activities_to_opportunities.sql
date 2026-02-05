-- Migration: Link activities to opportunities
-- Execute this in Supabase SQL Editor

-- Add opportunity_id column to activities table
ALTER TABLE activities 
ADD COLUMN IF NOT EXISTS opportunity_id INTEGER 
REFERENCES opportunities(id) ON DELETE CASCADE;

-- Add auto_generated flag to identify system-created activities
ALTER TABLE activities 
ADD COLUMN IF NOT EXISTS auto_generated BOOLEAN DEFAULT FALSE;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_activities_opportunity_id 
ON activities(opportunity_id);

-- Add comments to document the columns
COMMENT ON COLUMN activities.opportunity_id IS 'Links activity to an opportunity (for auto-generated activities from opportunity dates)';
COMMENT ON COLUMN activities.auto_generated IS 'TRUE if activity was auto-generated from opportunity dates (close_date or next_action_date)';

-- Update existing activities to have auto_generated = false
UPDATE activities 
SET auto_generated = FALSE 
WHERE auto_generated IS NULL;
