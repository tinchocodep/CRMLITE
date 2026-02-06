-- Migration: Update RLS policies for supervisor-comercial hierarchy
-- Description: Updates RLS policies for companies, contacts, opportunities, and activities
--              to support the supervisor-comercial relationship
-- Date: 2026-02-06

-- ============================================
-- COMPANIES RLS POLICIES
-- ============================================

DROP POLICY IF EXISTS "tenant_select_companies" ON companies;
DROP POLICY IF EXISTS "tenant_update_companies" ON companies;
DROP POLICY IF EXISTS "tenant_delete_companies" ON companies;

CREATE POLICY "tenant_select_companies"
ON companies FOR SELECT
USING (
    tenant_id = get_current_user_tenant_id()
    AND (
        -- Admin can see all companies
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
        OR
        -- Supervisor can see companies of their assigned comerciales
        (
            EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'supervisor')
            AND comercial_id IN (
                SELECT sc.comercial_id 
                FROM supervisor_comerciales sc
                JOIN users u ON u.comercial_id = sc.supervisor_id
                WHERE u.id = auth.uid()
            )
        )
        OR
        -- Comercial can only see their own companies
        comercial_id = (SELECT comercial_id FROM users WHERE id = auth.uid())
    )
);

CREATE POLICY "tenant_update_companies"
ON companies FOR UPDATE
USING (
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
            )
        )
        OR
        comercial_id = (SELECT comercial_id FROM users WHERE id = auth.uid())
    )
);

CREATE POLICY "tenant_delete_companies"
ON companies FOR DELETE
USING (
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
            )
        )
        OR
        comercial_id = (SELECT comercial_id FROM users WHERE id = auth.uid())
    )
);

-- ============================================
-- CONTACTS RLS POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view contacts in their tenant" ON contacts;
DROP POLICY IF EXISTS "Users can update contacts in their tenant" ON contacts;
DROP POLICY IF EXISTS "Users can delete contacts in their tenant" ON contacts;

CREATE POLICY "Users can view contacts in their tenant"
ON contacts FOR SELECT
USING (
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
            )
        )
        OR
        comercial_id = (SELECT comercial_id FROM users WHERE id = auth.uid())
    )
);

CREATE POLICY "Users can update contacts in their tenant"
ON contacts FOR UPDATE
USING (
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
            )
        )
        OR
        comercial_id = (SELECT comercial_id FROM users WHERE id = auth.uid())
    )
);

CREATE POLICY "Users can delete contacts in their tenant"
ON contacts FOR DELETE
USING (
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
            )
        )
        OR
        comercial_id = (SELECT comercial_id FROM users WHERE id = auth.uid())
    )
);

-- ============================================
-- OPPORTUNITIES RLS POLICIES
-- ============================================

DROP POLICY IF EXISTS "tenant_select_opportunities" ON opportunities;
DROP POLICY IF EXISTS "tenant_update_opportunities" ON opportunities;
DROP POLICY IF EXISTS "tenant_delete_opportunities" ON opportunities;

CREATE POLICY "tenant_select_opportunities"
ON opportunities FOR SELECT
USING (
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
            )
        )
        OR
        comercial_id = (SELECT comercial_id FROM users WHERE id = auth.uid())
    )
);

CREATE POLICY "tenant_update_opportunities"
ON opportunities FOR UPDATE
USING (
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
            )
        )
        OR
        comercial_id = (SELECT comercial_id FROM users WHERE id = auth.uid())
    )
);

CREATE POLICY "tenant_delete_opportunities"
ON opportunities FOR DELETE
USING (
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
            )
        )
        OR
        comercial_id = (SELECT comercial_id FROM users WHERE id = auth.uid())
    )
);

-- ============================================
-- ACTIVITIES RLS POLICIES
-- ============================================

DROP POLICY IF EXISTS "tenant_select_activities" ON activities;
DROP POLICY IF EXISTS "tenant_update_activities" ON activities;
DROP POLICY IF EXISTS "tenant_delete_activities" ON activities;

CREATE POLICY "tenant_select_activities"
ON activities FOR SELECT
USING (
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
            )
        )
        OR
        comercial_id = (SELECT comercial_id FROM users WHERE id = auth.uid())
    )
);

CREATE POLICY "tenant_update_activities"
ON activities FOR UPDATE
USING (
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
            )
        )
        OR
        comercial_id = (SELECT comercial_id FROM users WHERE id = auth.uid())
    )
);

CREATE POLICY "tenant_delete_activities"
ON activities FOR DELETE
USING (
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
            )
        )
        OR
        comercial_id = (SELECT comercial_id FROM users WHERE id = auth.uid())
    )
);

-- ✅ Migration complete
