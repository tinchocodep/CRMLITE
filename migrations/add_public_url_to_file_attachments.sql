-- Migration: Add public_url column to file_attachments
-- Applied: 2026-02-04
-- Description: Stores the full Storage URL for easier access to uploaded files

-- Add public_url column
ALTER TABLE file_attachments
ADD COLUMN IF NOT EXISTS public_url TEXT;

-- Add comment
COMMENT ON COLUMN file_attachments.public_url IS 'Full URL to access the file in Supabase Storage (authenticated URL for private buckets)';

-- Update existing records with their URLs
UPDATE file_attachments
SET public_url = 'https://lifeqgwsyopvaevywtsf.supabase.co/storage/v1/object/authenticated/legajo-documents/' || storage_path
WHERE storage_path IS NOT NULL 
AND public_url IS NULL
AND document_type IS NOT NULL;
