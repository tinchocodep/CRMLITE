-- Migration: Extend file_attachments table for legajo documents
-- Applied: 2026-02-04
-- Description: Adds columns to support legajo document management

-- Add document_type column for legajo-specific categorization
ALTER TABLE file_attachments
ADD COLUMN IF NOT EXISTS document_type TEXT 
CHECK (document_type IN (
    'dni_front', 'dni_back', 'selfie', 
    'cbu_proof', 'iibb_exemption', 'f1276',
    'other'
));

-- Add status column to track document lifecycle
ALTER TABLE file_attachments
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'
CHECK (status IN ('active', 'expired', 'replaced', 'deleted'));

-- Add expiry_date for documents that have expiration
ALTER TABLE file_attachments
ADD COLUMN IF NOT EXISTS expiry_date DATE;

-- Add tenant_id for multi-tenancy support
ALTER TABLE file_attachments
ADD COLUMN IF NOT EXISTS tenant_id BIGINT REFERENCES tenants(id);

-- Add updated_at for tracking modifications
ALTER TABLE file_attachments
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add comments for documentation
COMMENT ON COLUMN file_attachments.document_type IS 'Type of legajo document or other for general attachments';
COMMENT ON COLUMN file_attachments.status IS 'Document status: active, expired, replaced, or deleted';
COMMENT ON COLUMN file_attachments.expiry_date IS 'Expiration date for documents that expire';
COMMENT ON COLUMN file_attachments.tenant_id IS 'Multi-tenancy identifier';

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_file_attachments_legajo 
ON file_attachments(entity_type, entity_id, document_type, status)
WHERE document_type IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_file_attachments_tenant 
ON file_attachments(tenant_id, entity_type, status);

-- Update existing rows to have default values
UPDATE file_attachments 
SET status = 'active' 
WHERE status IS NULL;

UPDATE file_attachments 
SET document_type = 'other' 
WHERE document_type IS NULL;

-- Storage bucket creation (execute in Supabase Dashboard if needed)
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--     'legajo-documents',
--     'legajo-documents',
--     false,
--     5242880,
--     ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
-- );
