-- Fix file_number generation using a sequence instead of MAX
-- This eliminates race conditions completely

-- Create a sequence for file numbers
CREATE SEQUENCE IF NOT EXISTS file_number_seq START WITH 1;

-- Update the generate_file_number function to use the sequence
CREATE OR REPLACE FUNCTION public.generate_file_number()
RETURNS VARCHAR(20)
LANGUAGE plpgsql
AS $$
DECLARE
    next_number INTEGER;
    new_file_number VARCHAR(20);
BEGIN
    -- Get next value from sequence (atomic operation, no race condition)
    next_number := nextval('file_number_seq');
    
    -- Format as LEG-0001, LEG-0002, etc.
    new_file_number := 'LEG-' || LPAD(next_number::TEXT, 4, '0');
    
    RETURN new_file_number;
END;
$$;

-- Set the sequence to the current max + 1 (for existing data)
SELECT setval('file_number_seq', 
    COALESCE(
        (SELECT MAX(CAST(SUBSTRING(file_number FROM 5) AS INTEGER)) 
         FROM companies 
         WHERE file_number ~ '^LEG-[0-9]+$'), 
        0
    )
);
