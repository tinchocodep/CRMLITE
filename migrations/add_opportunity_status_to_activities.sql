-- Migration: Add opportunity_status to activities
-- Execute this in Supabase SQL Editor

-- Add opportunity_status column to activities table
ALTER TABLE activities 
ADD COLUMN IF NOT EXISTS opportunity_status TEXT 
CHECK (opportunity_status IN ('iniciado', 'presupuestado', 'negociado', 'ganado', 'perdido'));

-- Add comment to document the column
COMMENT ON COLUMN activities.opportunity_status IS 'Status of the linked opportunity (iniciado, presupuestado, negociado, ganado, perdido) - used to display status icon in calendar';
