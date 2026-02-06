-- Optimize RLS policies for better performance
-- Create helper functions to avoid recursion and improve speed

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get current user's tenant_id without recursion
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS BIGINT
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
    SELECT tenant_id 
    FROM public.users 
    WHERE id = auth.uid()
    LIMIT 1;
$$;

-- ============================================================================
-- USERS TABLE - OPTIMIZED POLICIES
-- ============================================================================

-- Drop old policy
DROP POLICY IF EXISTS "Allow authenticated users to view users" ON users;

-- Create optimized policy using the helper function
CREATE POLICY "Users can view users in their tenant (optimized)"
ON users
FOR SELECT
TO authenticated
USING (tenant_id = public.get_user_tenant_id());

-- ============================================================================
-- COMERCIALES TABLE - OPTIMIZED POLICIES
-- ============================================================================

-- Drop old policy
DROP POLICY IF EXISTS "Users can view comerciales in their tenant" ON comerciales;

-- Create optimized policy using the helper function
CREATE POLICY "Users can view comerciales in their tenant (optimized)"
ON comerciales
FOR SELECT
TO authenticated
USING (tenant_id = public.get_user_tenant_id());

-- Update other comerciales policies to use the helper function
DROP POLICY IF EXISTS "Admins can insert comerciales" ON comerciales;
DROP POLICY IF EXISTS "Admins can update comerciales" ON comerciales;
DROP POLICY IF EXISTS "Admins can delete comerciales" ON comerciales;

CREATE POLICY "Admins can insert comerciales (optimized)"
ON comerciales
FOR INSERT
TO authenticated
WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role = 'admin'
    )
);

CREATE POLICY "Admins can update comerciales (optimized)"
ON comerciales
FOR UPDATE
TO authenticated
USING (
    tenant_id = public.get_user_tenant_id()
    AND EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role = 'admin'
    )
);

CREATE POLICY "Admins can delete comerciales (optimized)"
ON comerciales
FOR DELETE
TO authenticated
USING (
    tenant_id = public.get_user_tenant_id()
    AND EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role = 'admin'
    )
);
