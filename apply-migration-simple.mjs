// Simple script to apply migration using Supabase REST API
const SUPABASE_URL = 'https://lifeqgwsyopvaevywtsf.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpZmVxZ3dzeW9wdmFldnl3dHNmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDA1NDQ3NywiZXhwIjoyMDg1NjMwNDc3fQ.DXmHXiJb3OMQNHO40ztcL36GTvkuLWbB7LEFD400urk';

const migration = `
-- Add comercial_id column to contacts
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS comercial_id uuid REFERENCES comerciales(id);
CREATE INDEX IF NOT EXISTS idx_contacts_comercial_id ON contacts(comercial_id);
`;

async function applyMigration() {
    try {
        console.log('🚀 Applying migration via SQL...');

        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SERVICE_KEY,
                'Authorization': `Bearer ${SERVICE_KEY}`
            },
            body: JSON.stringify({ query: migration })
        });

        const result = await response.text();
        console.log('Response:', response.status, result);

        if (response.ok) {
            console.log('✅ Migration applied successfully!');
        } else {
            console.log('⚠️  Response not OK, but this might be normal');
            console.log('Please verify manually in Supabase Dashboard');
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

applyMigration();
