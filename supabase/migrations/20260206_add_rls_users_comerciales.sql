-- Add RLS policies for users and comerciales tables
-- These tables need SELECT policies for TeamManagement to work

-- ============================================================================
-- USERS TABLE POLICIES
-- ============================================================================

-- Enable RLS on users table (if not already enabled)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Allow users to view other users in their tenant
CREATE POLICY "Users can view users in their tenant"
ON users
FOR SELECT
TO authenticated
USING (
    tenant_id IN (
        SELECT tenant_id 
        FROM users 
        WHERE id = auth.uid()
    )
);

-- ============================================================================
-- COMERCIALES TABLE POLICIES
-- ============================================================================

-- Enable RLS on comerciales table (if not already enabled)
ALTER TABLE comerciales ENABLE ROW LEVEL SECURITY;

-- Policy: Allow users to view comerciales in their tenant
CREATE POLICY "Users can view comerciales in their tenant"
ON comerciales
FOR SELECT
TO authenticated
USING (
    tenant_id IN (
        SELECT tenant_id 
        FROM users 
        WHERE id = auth.uid()
    )
);

-- Policy: Allow admins to insert comerciales
CREATE POLICY "Admins can insert comerciales"
ON comerciales
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role = 'admin'
        AND tenant_id = comerciales.tenant_id
    )
);

-- Policy: Allow admins to update comerciales
CREATE POLICY "Admins can update comerciales"
ON comerciales
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role = 'admin'
        AND tenant_id = comerciales.tenant_id
    )
);

-- Policy: Allow admins to delete comerciales (soft delete)
CREATE POLICY "Admins can delete comerciales"
ON comerciales
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role = 'admin'
        AND tenant_id = comerciales.tenant_id
    )
);
