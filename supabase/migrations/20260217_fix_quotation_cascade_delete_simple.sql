-- Simple fix for quotation deletion
-- This allows deleting quotations even if they have orders

ALTER TABLE orders
DROP CONSTRAINT IF EXISTS orders_quotation_id_fkey;

ALTER TABLE orders
ADD CONSTRAINT orders_quotation_id_fkey
FOREIGN KEY (quotation_id) 
REFERENCES quotations(id) 
ON DELETE SET NULL;
