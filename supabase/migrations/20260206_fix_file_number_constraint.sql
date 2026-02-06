-- Fix file_number unique constraint issue
-- The trigger generates file_number sequentially, but there's a race condition
-- Solution: Make the constraint DEFERRABLE so it's checked at transaction commit

-- Drop old constraint
ALTER TABLE companies 
DROP CONSTRAINT IF EXISTS companies_file_number_key;

-- Add new DEFERRABLE INITIALLY DEFERRED constraint
-- This allows the trigger to run and generate unique numbers before checking
ALTER TABLE companies
ADD CONSTRAINT companies_file_number_key 
UNIQUE (file_number) 
DEFERRABLE INITIALLY DEFERRED;
