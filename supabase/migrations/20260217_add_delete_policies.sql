-- =====================================================
-- ADD DELETE POLICIES FOR QUOTATIONS, ORDERS, OPPORTUNITIES, AND ACTIVITIES
-- =====================================================

-- 1. QUOTATIONS - Allow DELETE for users in the same tenant
DROP POLICY IF EXISTS "Users can delete quotations in their tenant" ON quotations;
CREATE POLICY "Users can delete quotations in their tenant"
ON quotations
FOR DELETE
TO authenticated
USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- 2. QUOTATION_LINES - Cascade delete handled by foreign key, but add policy for safety
DROP POLICY IF EXISTS "Users can delete quotation_lines in their tenant" ON quotation_lines;
CREATE POLICY "Users can delete quotation_lines in their tenant"
ON quotation_lines
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM quotations
        WHERE quotations.id = quotation_lines.quotation_id
        AND quotations.tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
    )
);

-- 3. ORDERS - Allow DELETE for users in the same tenant
DROP POLICY IF EXISTS "Users can delete orders in their tenant" ON orders;
CREATE POLICY "Users can delete orders in their tenant"
ON orders
FOR DELETE
TO authenticated
USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- 4. ORDER_LINES - Cascade delete handled by foreign key, but add policy for safety
DROP POLICY IF EXISTS "Users can delete order_lines in their tenant" ON order_lines;
CREATE POLICY "Users can delete order_lines in their tenant"
ON order_lines
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM orders
        WHERE orders.id = order_lines.order_id
        AND orders.tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
    )
);

-- 5. OPPORTUNITIES - Allow DELETE for users in the same tenant
DROP POLICY IF EXISTS "Users can delete opportunities in their tenant" ON opportunities;
CREATE POLICY "Users can delete opportunities in their tenant"
ON opportunities
FOR DELETE
TO authenticated
USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- 6. ACTIVITIES - Allow DELETE for users in the same tenant
DROP POLICY IF EXISTS "Users can delete activities in their tenant" ON activities;
CREATE POLICY "Users can delete activities in their tenant"
ON activities
FOR DELETE
TO authenticated
USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- =====================================================
-- VERIFY CASCADE DELETE CONSTRAINTS
-- =====================================================

-- Ensure quotation_lines cascade on quotation delete
ALTER TABLE quotation_lines
DROP CONSTRAINT IF EXISTS quotation_lines_quotation_id_fkey,
ADD CONSTRAINT quotation_lines_quotation_id_fkey
FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE;

-- Ensure order_lines cascade on order delete
ALTER TABLE order_lines
DROP CONSTRAINT IF EXISTS order_lines_order_id_fkey,
ADD CONSTRAINT order_lines_order_id_fkey
FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
