-- =====================================================
-- FIX CASCADE DELETE FOR QUOTATIONS
-- =====================================================

-- The issue is that orders table has a foreign key to quotations
-- but it doesn't have ON DELETE CASCADE, so when you try to delete
-- a quotation that has orders, it fails with a 409 conflict error.

-- Fix: Add ON DELETE SET NULL to orders.quotation_id
-- We use SET NULL instead of CASCADE because we want to keep the order
-- even if the quotation is deleted (the order is independent once created)

ALTER TABLE orders
DROP CONSTRAINT IF EXISTS orders_quotation_id_fkey,
ADD CONSTRAINT orders_quotation_id_fkey
FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE SET NULL;

-- Verify the constraint
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.table_name = 'orders' 
  AND tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name = 'quotation_id';
