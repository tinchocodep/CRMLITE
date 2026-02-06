-- Migration: Add INSERT policies for companies, contacts, opportunities, and activities
-- Description: Allows users to create records with proper RLS checks
-- Date: 2026-02-06

-- ============================================
-- COMPANIES INSERT POLICY
-- ============================================

DROP POLICY IF EXISTS "tenant_insert_companies" ON companies;

CREATE POLICY "tenant_insert_companies"
ON companies FOR INSERT
WITH CHECK (
    tenant_id = get_current_user_tenant_id()
    AND (
        -- Admin can create companies
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
        OR
        -- Supervisor can create companies for their assigned comerciales
        (
            EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'supervisor')
            AND comercial_id IN (
                SELECT sc.comercial_id 
                FROM supervisor_comerciales sc
                JOIN users u ON u.comercial_id = sc.supervisor_id
                WHERE u.id = auth.uid()
                UNION
                -- Supervisor can also create for themselves
                SELECT comercial_id FROM users WHERE id = auth.uid()
            )
        )
        OR
        -- Comercial can create companies for themselves
        comercial_id = (SELECT comercial_id FROM users WHERE id = auth.uid())
    )
);

-- ============================================
-- CONTACTS INSERT POLICY
-- ============================================

DROP POLICY IF EXISTS "Users can insert contacts in their tenant" ON contacts;

CREATE POLICY "Users can insert contacts in their tenant"
ON contacts FOR INSERT
WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
    AND (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
        OR
        (
            EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'supervisor')
            AND comercial_id IN (
                SELECT sc.comercial_id 
                FROM supervisor_comerciales sc
                JOIN users u ON u.comercial_id = sc.supervisor_id
                WHERE u.id = auth.uid()
                UNION
                SELECT comercial_id FROM users WHERE id = auth.uid()
            )
        )
        OR
        comercial_id = (SELECT comercial_id FROM users WHERE id = auth.uid())
    )
);

-- ============================================
-- OPPORTUNITIES INSERT POLICY
-- ============================================

DROP POLICY IF EXISTS "tenant_insert_opportunities" ON opportunities;

CREATE POLICY "tenant_insert_opportunities"
ON opportunities FOR INSERT
WITH CHECK (
    tenant_id = get_current_user_tenant_id()
    AND (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
        OR
        (
            EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'supervisor')
            AND comercial_id IN (
                SELECT sc.comercial_id 
                FROM supervisor_comerciales sc
                JOIN users u ON u.comercial_id = sc.supervisor_id
                WHERE u.id = auth.uid()
                UNION
                SELECT comercial_id FROM users WHERE id = auth.uid()
            )
        )
        OR
        comercial_id = (SELECT comercial_id FROM users WHERE id = auth.uid())
    )
);

-- ============================================
-- ACTIVITIES INSERT POLICY
-- ============================================

DROP POLICY IF EXISTS "tenant_insert_activities" ON activities;

CREATE POLICY "tenant_insert_activities"
ON activities FOR INSERT
WITH CHECK (
    tenant_id = get_current_user_tenant_id()
    AND (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
        OR
        (
            EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'supervisor')
            AND comercial_id IN (
                SELECT sc.comercial_id 
                FROM supervisor_comerciales sc
                JOIN users u ON u.comercial_id = sc.supervisor_id
                WHERE u.id = auth.uid()
                UNION
                SELECT comercial_id FROM users WHERE id = auth.uid()
            )
        )
        OR
        comercial_id = (SELECT comercial_id FROM users WHERE id = auth.uid())
    )
);

-- ✅ Migration complete
