-- Fix activities INSERT policy for admins
-- Admins should be able to create activities for ANY comercial in their tenant

DROP POLICY IF EXISTS tenant_insert_activities ON activities;

CREATE POLICY tenant_insert_activities ON activities
FOR INSERT
WITH CHECK (
    tenant_id = get_current_user_tenant_id()
    AND (
        -- Admins can create activities for anyone in their tenant
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
        OR
        -- Supervisors can create activities for their assigned comerciales + themselves
        (
            EXISTS (
                SELECT 1 FROM users
                WHERE users.id = auth.uid()
                AND users.role = 'supervisor'
            )
            AND comercial_id IN (
                -- Their assigned comerciales
                SELECT sc.comercial_id
                FROM supervisor_comerciales sc
                JOIN users u ON u.comercial_id = sc.supervisor_id
                WHERE u.id = auth.uid()
                UNION
                -- Themselves
                SELECT users.comercial_id
                FROM users
                WHERE users.id = auth.uid()
            )
        )
        OR
        -- Regular users can only create activities for themselves
        comercial_id = (
            SELECT users.comercial_id
            FROM users
            WHERE users.id = auth.uid()
        )
    )
);
