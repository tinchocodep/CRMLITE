import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase environment variables');
    console.error('Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function migrateNullComercialIds() {
    try {
        console.log('🔍 Step 1: Finding comercial ID for desarrollador@sailo.ag...\n');

        // Get the comercial ID
        const { data: comercial, error: comercialError } = await supabase
            .from('comerciales')
            .select('id, name, email')
            .eq('email', 'desarrollador@sailo.ag')
            .eq('is_active', true)
            .single();

        if (comercialError) {
            console.error('❌ Error finding comercial:', comercialError);
            return;
        }

        if (!comercial) {
            console.error('❌ No active comercial found with email: desarrollador@sailo.ag');
            return;
        }

        console.log(`✅ Found comercial: ${comercial.name} (${comercial.email})`);
        console.log(`   ID: ${comercial.id}\n`);

        // Count affected records
        console.log('🔍 Step 2: Counting affected records...\n');

        const { count: nullCompanies } = await supabase
            .from('companies')
            .select('*', { count: 'exact', head: true })
            .is('comercial_id', null);

        const { count: nullContacts } = await supabase
            .from('contacts')
            .select('*', { count: 'exact', head: true })
            .is('comercial_id', null);

        console.log(`   Companies with NULL comercial_id: ${nullCompanies || 0}`);
        console.log(`   Contacts with NULL comercial_id: ${nullContacts || 0}\n`);

        if ((nullCompanies || 0) === 0 && (nullContacts || 0) === 0) {
            console.log('✅ No records to migrate. All records already have comercial_id assigned.');
            return;
        }

        // Migrate companies
        if (nullCompanies && nullCompanies > 0) {
            console.log(`🔄 Step 3: Updating ${nullCompanies} companies...\n`);

            const { error: updateCompaniesError } = await supabase
                .from('companies')
                .update({ comercial_id: comercial.id })
                .is('comercial_id', null);

            if (updateCompaniesError) {
                console.error('❌ Error updating companies:', updateCompaniesError);
            } else {
                console.log(`✅ Successfully updated ${nullCompanies} companies\n`);
            }
        }

        // Migrate contacts
        if (nullContacts && nullContacts > 0) {
            console.log(`🔄 Step 4: Updating ${nullContacts} contacts...\n`);

            const { error: updateContactsError } = await supabase
                .from('contacts')
                .update({ comercial_id: comercial.id })
                .is('comercial_id', null);

            if (updateContactsError) {
                console.error('❌ Error updating contacts:', updateContactsError);
            } else {
                console.log(`✅ Successfully updated ${nullContacts} contacts\n`);
            }
        }

        // Verify migration
        console.log('🔍 Step 5: Verifying migration...\n');

        const { count: remainingCompanies } = await supabase
            .from('companies')
            .select('*', { count: 'exact', head: true })
            .is('comercial_id', null);

        const { count: remainingContacts } = await supabase
            .from('contacts')
            .select('*', { count: 'exact', head: true })
            .is('comercial_id', null);

        console.log(`   Companies with NULL comercial_id: ${remainingCompanies || 0}`);
        console.log(`   Contacts with NULL comercial_id: ${remainingContacts || 0}\n`);

        if ((remainingCompanies || 0) === 0 && (remainingContacts || 0) === 0) {
            console.log('✅ Migration completed successfully! All records now have comercial_id assigned.');
        } else {
            console.log('⚠️  Some records still have NULL comercial_id. Please review manually.');
        }

    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}

// Run migration
console.log('═══════════════════════════════════════════════════════════');
console.log('  Comercial ID Migration Script');
console.log('  Assigning NULL records to: desarrollador@sailo.ag');
console.log('═══════════════════════════════════════════════════════════\n');

migrateNullComercialIds();
