-- Migration: Create supervisor_comerciales relationship table
-- Description: Allows supervisors to have specific comerciales assigned to them
-- Date: 2026-02-05

-- Create the supervisor_comerciales table
CREATE TABLE IF NOT EXISTS public.supervisor_comerciales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supervisor_id UUID NOT NULL REFERENCES public.comerciales(id) ON DELETE CASCADE,
    comercial_id UUID NOT NULL REFERENCES public.comerciales(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Ensure a comercial can only be assigned once to a supervisor
    UNIQUE(supervisor_id, comercial_id)
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_supervisor_comerciales_supervisor 
    ON public.supervisor_comerciales(supervisor_id);

CREATE INDEX IF NOT EXISTS idx_supervisor_comerciales_comercial 
    ON public.supervisor_comerciales(comercial_id);

-- Enable Row Level Security
ALTER TABLE public.supervisor_comerciales ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Policy: Allow authenticated users to read supervisor-comercial relationships
CREATE POLICY "Allow authenticated users to read supervisor_comerciales"
    ON public.supervisor_comerciales
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Only admins can insert supervisor-comercial relationships
CREATE POLICY "Only admins can insert supervisor_comerciales"
    ON public.supervisor_comerciales
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Policy: Only admins can update supervisor-comercial relationships
CREATE POLICY "Only admins can update supervisor_comerciales"
    ON public.supervisor_comerciales
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Policy: Only admins can delete supervisor-comercial relationships
CREATE POLICY "Only admins can delete supervisor_comerciales"
    ON public.supervisor_comerciales
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Add helpful comments
COMMENT ON TABLE public.supervisor_comerciales IS 'Relationship table between supervisors and their assigned comerciales';
COMMENT ON COLUMN public.supervisor_comerciales.supervisor_id IS 'Reference to the supervisor (comercial with supervisor role)';
COMMENT ON COLUMN public.supervisor_comerciales.comercial_id IS 'Reference to the comercial assigned to this supervisor';

-- Grant permissions
GRANT SELECT ON public.supervisor_comerciales TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.supervisor_comerciales TO authenticated;
