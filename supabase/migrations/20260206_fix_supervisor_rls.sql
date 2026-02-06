-- Fix RLS policy for companies to allow supervisors to see their own data
-- even if they don't have assigned comerciales

-- Drop old policy
DROP POLICY IF EXISTS "tenant_select_companies" ON companies;

-- Create corrected policy
CREATE POLICY "tenant_select_companies"
ON companies
FOR SELECT
TO authenticated
USING (
    tenant_id = get_current_user_tenant_id()
    AND (
        -- Admins see everything in their tenant
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid()
            AND role = 'admin'
        )
        OR
        -- Supervisors see:
        -- 1. Companies of their assigned comerciales
        -- 2. Their own companies (comercial_id = their comercial_id)
        (
            EXISTS (
                SELECT 1 FROM users
                WHERE id = auth.uid()
                AND role = 'supervisor'
            )
            AND (
                comercial_id IN (
                    SELECT sc.comercial_id
                    FROM supervisor_comerciales sc
                    JOIN users u ON u.comercial_id = sc.supervisor_id
                    WHERE u.id = auth.uid()
                )
                OR
                comercial_id = (
                    SELECT comercial_id
                    FROM users
                    WHERE id = auth.uid()
                )
            )
        )
        OR
        -- Regular users see only their own companies
        (
            comercial_id = (
                SELECT comercial_id
                FROM users
                WHERE id = auth.uid()
            )
        )
    )
);
