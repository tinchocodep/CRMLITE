-- Enable Supabase Realtime for opportunities and activities tables
-- This is required for postgres_changes subscriptions to receive events

-- Set REPLICA IDENTITY FULL so DELETE events include the old row data
ALTER TABLE opportunities REPLICA IDENTITY FULL;
ALTER TABLE activities REPLICA IDENTITY FULL;

-- Add tables to the Supabase Realtime publication
-- If already in publication, this will error silently in Supabase
DO $$
BEGIN
    -- Add opportunities to realtime publication
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE opportunities;
    EXCEPTION WHEN duplicate_object THEN
        -- Already in publication, ignore
        NULL;
    END;
    
    -- Add activities to realtime publication
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE activities;
    EXCEPTION WHEN duplicate_object THEN
        -- Already in publication, ignore
        NULL;
    END;
END $$;
