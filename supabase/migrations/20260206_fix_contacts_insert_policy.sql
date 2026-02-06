-- Fix contacts INSERT policy to validate comercial_id
-- This ensures contacts are created with the correct comercial_id

DROP POLICY IF EXISTS "Users can insert contacts in their tenant" ON contacts;

CREATE POLICY "Users can insert contacts in their tenant"
ON contacts FOR INSERT
WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
    AND (
        -- Admin and Supervisor can insert contacts with any comercial_id in their tenant
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'supervisor')
        )
        OR
        -- Comercial can only insert contacts with their own comercial_id
        comercial_id = (SELECT comercial_id FROM users WHERE id = auth.uid())
    )
);
