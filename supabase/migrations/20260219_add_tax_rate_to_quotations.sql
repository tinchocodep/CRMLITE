-- Agrega columna tax_rate a la tabla quotations para registrar el % de IVA aplicado
-- Valores: 21 (IVA 21%), 10.5 (IVA reducido), 0 (Sin IVA/Exento)
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS tax_rate numeric(5,2) DEFAULT 21;
