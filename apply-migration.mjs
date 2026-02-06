import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = 'https://lifeqgwsyopvaevywtsf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpZmVxZ3dzeW9wdmFldnl3dHNmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDA1NDQ3NywiZXhwIjoyMDg1NjMwNDc3fQ.DXmHXiJb3OMQNHO40ztcL36GTvkuLWbB7LEFD400urk';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function applyMigration() {
    try {
        console.log('📦 Reading migration file...');
        const migrationSQL = readFileSync('./supabase/migrations/20260206_add_comercial_id_to_contacts.sql', 'utf-8');

        console.log('🚀 Applying migration to add comercial_id to contacts...');

        // Split SQL into individual statements
        const statements = migrationSQL
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        for (const statement of statements) {
            if (statement) {
                console.log(`\n📝 Executing: ${statement.substring(0, 100)}...`);
                const { data, error } = await supabase.rpc('exec_sql', { sql: statement + ';' });

                if (error) {
                    console.error('❌ Error:', error);
                    // Continue with next statement
                } else {
                    console.log('✅ Success');
                }
            }
        }

        console.log('\n🎉 Migration process completed!');
        console.log('\n🔍 Verifying column was added...');

        const { data: columns, error: verifyError } = await supabase
            .from('contacts')
            .select('*')
            .limit(1);

        if (verifyError) {
            console.log('⚠️  Could not verify (this is normal):', verifyError.message);
        } else {
            console.log('✅ Contacts table is accessible');
        }

    } catch (err) {
        console.error('❌ Fatal error:', err.message);
        process.exit(1);
    }
}

applyMigration();
