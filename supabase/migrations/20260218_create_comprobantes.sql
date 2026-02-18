-- Create comprobantes table
-- Stores invoices (FACTURA), remitos (REMITO), and payments (COBRO)

CREATE TABLE IF NOT EXISTS comprobantes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    order_id BIGINT REFERENCES orders(id) ON DELETE CASCADE,
    order_number TEXT,
    tipo TEXT NOT NULL CHECK (tipo IN ('FACTURA', 'REMITO', 'COBRO')),
    letra TEXT,
    punto_venta INTEGER DEFAULT 0,
    numero_cbte INTEGER DEFAULT 0,
    cae TEXT,
    vto_cae TEXT,
    qr_url TEXT,
    pdf_url TEXT,
    subtotal NUMERIC(12,2) DEFAULT 0,
    tax NUMERIC(12,2) DEFAULT 0,
    total NUMERIC(12,2) DEFAULT 0,
    client_name TEXT,
    fecha_emision DATE,
    status TEXT DEFAULT 'pending',
    -- Payment-specific fields (for COBRO)
    payment_method TEXT,
    is_partial_payment BOOLEAN DEFAULT FALSE,
    remaining_balance NUMERIC(12,2) DEFAULT 0,
    notes TEXT,
    -- Remito-specific fields (for REMITO)
    products JSONB,
    is_partial_remito BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE comprobantes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "comprobantes_select_tenant" ON comprobantes
    FOR SELECT USING (tenant_id = (
        SELECT tenant_id FROM users WHERE id = auth.uid()
    ));

CREATE POLICY "comprobantes_insert_tenant" ON comprobantes
    FOR INSERT WITH CHECK (tenant_id = (
        SELECT tenant_id FROM users WHERE id = auth.uid()
    ));

CREATE POLICY "comprobantes_update_tenant" ON comprobantes
    FOR UPDATE USING (tenant_id = (
        SELECT tenant_id FROM users WHERE id = auth.uid()
    ));

CREATE POLICY "comprobantes_delete_tenant" ON comprobantes
    FOR DELETE USING (tenant_id = (
        SELECT tenant_id FROM users WHERE id = auth.uid()
    ));

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_comprobantes_order_id ON comprobantes(order_id);
CREATE INDEX IF NOT EXISTS idx_comprobantes_tenant_id ON comprobantes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_comprobantes_client_name ON comprobantes(client_name);
CREATE INDEX IF NOT EXISTS idx_comprobantes_tipo ON comprobantes(tipo);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_comprobantes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER comprobantes_updated_at
    BEFORE UPDATE ON comprobantes
    FOR EACH ROW
    EXECUTE FUNCTION update_comprobantes_updated_at();

-- ─── Auto-populate client_name on orders ─────────────────────────────────────
-- Trigger: whenever an order is inserted or updated, auto-fill client_name
-- from the related company (trade_name preferred, fallback to legal_name)

CREATE OR REPLACE FUNCTION sync_order_client_name()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.company_id IS NOT NULL THEN
        SELECT COALESCE(trade_name, legal_name)
        INTO NEW.client_name
        FROM companies
        WHERE id = NEW.company_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_sync_client_name
    BEFORE INSERT OR UPDATE OF company_id ON orders
    FOR EACH ROW
    EXECUTE FUNCTION sync_order_client_name();

-- Backfill existing orders that have no client_name
UPDATE orders o
SET client_name = COALESCE(c.trade_name, c.legal_name)
FROM companies c
WHERE o.company_id = c.id
AND (o.client_name IS NULL OR o.client_name = '');
