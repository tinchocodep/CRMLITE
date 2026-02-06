-- Allow admins to update users (including comercial_id)
-- This is needed when creating new users to link them to their comercial

-- Drop old restrictive policy if exists
DROP POLICY IF EXISTS "Allow updating own profile" ON users;

-- Create policy for users to update their own profile
CREATE POLICY "Users can update own profile"
ON users
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Create policy for admins to update any user in their tenant
CREATE POLICY "Admins can update users in their tenant"
ON users
FOR UPDATE
TO authenticated
USING (
    tenant_id = public.get_user_tenant_id()
    AND EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role = 'admin'
    )
)
WITH CHECK (
    tenant_id = public.get_user_tenant_id()
    AND EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role = 'admin'
    )
);
