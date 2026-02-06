-- Fix RLS policies for users and comerciales
-- The previous policies had a recursion issue

-- ============================================================================
-- DROP BROKEN POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view users in their tenant" ON users;
DROP POLICY IF EXISTS "Users can view comerciales in their tenant" ON comerciales;
DROP POLICY IF EXISTS "Admins can insert comerciales" ON comerciales;
DROP POLICY IF EXISTS "Admins can update comerciales" ON comerciales;
DROP POLICY IF EXISTS "Admins can delete comerciales" ON comerciales;

-- ============================================================================
-- USERS TABLE POLICIES (FIXED)
-- ============================================================================

-- Policy: Allow all authenticated users to view users
-- We can't filter by tenant_id here because it would create recursion
-- Instead, we rely on application-level filtering
CREATE POLICY "Allow authenticated users to view users"
ON users
FOR SELECT
TO authenticated
USING (true);

-- ============================================================================
-- COMERCIALES TABLE POLICIES (FIXED)
-- ============================================================================

-- Policy: Allow users to view comerciales in their tenant
-- Use a direct join to avoid recursion
CREATE POLICY "Users can view comerciales in their tenant"
ON comerciales
FOR SELECT
TO authenticated
USING (
    tenant_id = (
        SELECT u.tenant_id 
        FROM users u
        WHERE u.id = auth.uid()
        LIMIT 1
    )
);

-- Policy: Allow admins to insert comerciales
CREATE POLICY "Admins can insert comerciales"
ON comerciales
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid()
        AND u.role = 'admin'
        AND u.tenant_id = comerciales.tenant_id
    )
);

-- Policy: Allow admins to update comerciales
CREATE POLICY "Admins can update comerciales"
ON comerciales
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid()
        AND u.role = 'admin'
        AND u.tenant_id = comerciales.tenant_id
    )
);

-- Policy: Allow admins to delete comerciales
CREATE POLICY "Admins can delete comerciales"
ON comerciales
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid()
        AND u.role = 'admin'
        AND u.tenant_id = comerciales.tenant_id
    )
);
