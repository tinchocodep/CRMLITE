-- ============================================
-- MIGRACIÓN: Agregar comercial_id a contacts
-- ============================================
-- Copia y pega este SQL en el SQL Editor de Supabase:
-- https://supabase.com/dashboard/project/lifeqgwsyopvaevywtsf/sql/new

-- 1. Agregar columna comercial_id
ALTER TABLE contacts 
ADD COLUMN IF NOT EXISTS comercial_id uuid REFERENCES comerciales(id);

-- 2. Crear índice para mejor performance
CREATE INDEX IF NOT EXISTS idx_contacts_comercial_id ON contacts(comercial_id);

-- 3. Actualizar RLS policies
DROP POLICY IF EXISTS "Users can view contacts in their tenant" ON contacts;
DROP POLICY IF EXISTS "Users can insert contacts in their tenant" ON contacts;
DROP POLICY IF EXISTS "Users can update contacts in their tenant" ON contacts;
DROP POLICY IF EXISTS "Users can delete contacts in their tenant" ON contacts;

-- 4. Crear nuevas policies con filtrado por comercial
CREATE POLICY "Users can view contacts in their tenant"
ON contacts FOR SELECT
USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
    AND (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'supervisor'))
        OR comercial_id = (SELECT comercial_id FROM users WHERE id = auth.uid())
    )
);

CREATE POLICY "Users can insert contacts in their tenant"
ON contacts FOR INSERT
WITH CHECK (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update contacts in their tenant"
ON contacts FOR UPDATE
USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
    AND (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'supervisor'))
        OR comercial_id = (SELECT comercial_id FROM users WHERE id = auth.uid())
    )
);

CREATE POLICY "Users can delete contacts in their tenant"
ON contacts FOR DELETE
USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
    AND (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'supervisor'))
        OR comercial_id = (SELECT comercial_id FROM users WHERE id = auth.uid())
    )
);

-- ✅ Migración completa
