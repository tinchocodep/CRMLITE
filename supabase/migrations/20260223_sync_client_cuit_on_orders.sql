-- Sync client_cuit from companies to orders
-- Fixes existing orders that were created without CUIT and ensures future ones auto-populate it.

-- 1. Update the sync trigger to also populate client_cuit
CREATE OR REPLACE FUNCTION sync_order_client_name()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.company_id IS NOT NULL THEN
        SELECT
            COALESCE(trade_name, legal_name),
            cuit
        INTO NEW.client_name, NEW.client_cuit
        FROM companies
        WHERE id = NEW.company_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Backfill client_cuit for existing orders that have a company_id but no CUIT
UPDATE orders o
SET client_cuit = c.cuit
FROM companies c
WHERE o.company_id = c.id
  AND (o.client_cuit IS NULL OR o.client_cuit = '');
