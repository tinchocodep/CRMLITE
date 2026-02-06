-- Fix file_number unique constraint issue
-- The trigger generates file_number sequentially, but UNIQUE constraints don't allow multiple NULLs
-- Solution: Use a partial UNIQUE index that only applies to non-NULL values

-- Drop old constraint
ALTER TABLE companies 
DROP CONSTRAINT IF EXISTS companies_file_number_key;

-- Create partial UNIQUE index (only for non-NULL values)
-- This allows multiple NULL values but guarantees uniqueness for actual file numbers
CREATE UNIQUE INDEX IF NOT EXISTS companies_file_number_unique_idx 
ON companies (file_number) 
WHERE file_number IS NOT NULL;
