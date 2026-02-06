-- Add comercial_id column to contacts table if it doesn't exist
-- This allows contacts to be linked to the comercial who created them

DO $$ 
BEGIN
    -- Add comercial_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contacts' AND column_name = 'comercial_id'
    ) THEN
        ALTER TABLE contacts 
        ADD COLUMN comercial_id bigint REFERENCES comerciales(id);
        
        -- Create index for better query performance
        CREATE INDEX IF NOT EXISTS idx_contacts_comercial_id ON contacts(comercial_id);
        
        RAISE NOTICE 'Added comercial_id column to contacts table';
    ELSE
        RAISE NOTICE 'comercial_id column already exists in contacts table';
    END IF;
END $$;

-- Update RLS policies for contacts to include comercial_id filtering
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view contacts in their tenant" ON contacts;
DROP POLICY IF EXISTS "Users can insert contacts in their tenant" ON contacts;
DROP POLICY IF EXISTS "Users can update contacts in their tenant" ON contacts;
DROP POLICY IF EXISTS "Users can delete contacts in their tenant" ON contacts;

-- Recreate policies with comercial_id support
CREATE POLICY "Users can view contacts in their tenant"
ON contacts FOR SELECT
USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
    AND (
        -- Admin and Supervisor can see all contacts in their tenant
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'supervisor')
        )
        OR
        -- Comercial can only see their own contacts
        comercial_id = (SELECT comercial_id FROM users WHERE id = auth.uid())
    )
);

CREATE POLICY "Users can insert contacts in their tenant"
ON contacts FOR INSERT
WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
);

CREATE POLICY "Users can update contacts in their tenant"
ON contacts FOR UPDATE
USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
    AND (
        -- Admin and Supervisor can update all contacts in their tenant
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'supervisor')
        )
        OR
        -- Comercial can only update their own contacts
        comercial_id = (SELECT comercial_id FROM users WHERE id = auth.uid())
    )
);

CREATE POLICY "Users can delete contacts in their tenant"
ON contacts FOR DELETE
USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
    AND (
        -- Admin and Supervisor can delete all contacts in their tenant
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'supervisor')
        )
        OR
        -- Comercial can only delete their own contacts
        comercial_id = (SELECT comercial_id FROM users WHERE id = auth.uid())
    )
);
