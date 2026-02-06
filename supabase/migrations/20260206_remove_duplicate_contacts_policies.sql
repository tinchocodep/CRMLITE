-- Remove duplicate/old tenant_ policies for contacts table
-- These are conflicting with the newer role-based policies

DROP POLICY IF EXISTS "tenant_select_contacts" ON contacts;
DROP POLICY IF EXISTS "tenant_insert_contacts" ON contacts;
DROP POLICY IF EXISTS "tenant_update_contacts" ON contacts;
DROP POLICY IF EXISTS "tenant_delete_contacts" ON contacts;
