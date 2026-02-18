-- Add credit_limit column to companies table
-- Allows configuring a per-client credit limit from the UI

ALTER TABLE companies
ADD COLUMN IF NOT EXISTS credit_limit NUMERIC(14,2) DEFAULT 0;

-- Set a sensible default for existing companies that have orders
UPDATE companies
SET credit_limit = 200000
WHERE credit_limit = 0;
