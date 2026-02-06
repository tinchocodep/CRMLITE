-- Temporary fix: Make INSERT policy more permissive for debugging
-- This will help us identify if the issue is with the RLS policy

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Only admins can insert supervisor_comerciales" ON public.supervisor_comerciales;

-- Create a more permissive policy for debugging
-- IMPORTANT: This allows ANY authenticated user to insert
-- We'll fix this once we identify the issue
CREATE POLICY "Temp: Allow all authenticated to insert supervisor_comerciales"
    ON public.supervisor_comerciales
    FOR INSERT
    TO authenticated
    WITH CHECK (true);
