import pg from 'pg';
const { Client } = pg;

const client = new Client({
    host: 'db.lifeqgwsyopvaevywtsf.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'Neuracall2024',
    ssl: { rejectUnauthorized: false }
});

async function applyMigration() {
    try {
        console.log('🔌 Connecting to database...');
        await client.connect();
        console.log('✅ Connected!');

        console.log('\n📝 Step 1: Adding comercial_id column...');
        await client.query(`
            ALTER TABLE contacts 
            ADD COLUMN IF NOT EXISTS comercial_id uuid REFERENCES comerciales(id);
        `);
        console.log('✅ Column added');

        console.log('\n📝 Step 2: Creating index...');
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_contacts_comercial_id ON contacts(comercial_id);
        `);
        console.log('✅ Index created');

        console.log('\n📝 Step 3: Updating RLS policies...');

        // Drop old policies
        await client.query(`DROP POLICY IF EXISTS "Users can view contacts in their tenant" ON contacts;`);
        await client.query(`DROP POLICY IF EXISTS "Users can insert contacts in their tenant" ON contacts;`);
        await client.query(`DROP POLICY IF EXISTS "Users can update contacts in their tenant" ON contacts;`);
        await client.query(`DROP POLICY IF EXISTS "Users can delete contacts in their tenant" ON contacts;`);
        console.log('✅ Old policies dropped');

        // Create new policies
        await client.query(`
            CREATE POLICY "Users can view contacts in their tenant"
            ON contacts FOR SELECT
            USING (
                tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
                AND (
                    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'supervisor'))
                    OR comercial_id = (SELECT comercial_id FROM users WHERE id = auth.uid())
                )
            );
        `);

        await client.query(`
            CREATE POLICY "Users can insert contacts in their tenant"
            ON contacts FOR INSERT
            WITH CHECK (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));
        `);

        await client.query(`
            CREATE POLICY "Users can update contacts in their tenant"
            ON contacts FOR UPDATE
            USING (
                tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
                AND (
                    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'supervisor'))
                    OR comercial_id = (SELECT comercial_id FROM users WHERE id = auth.uid())
                )
            );
        `);

        await client.query(`
            CREATE POLICY "Users can delete contacts in their tenant"
            ON contacts FOR DELETE
            USING (
                tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
                AND (
                    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'supervisor'))
                    OR comercial_id = (SELECT comercial_id FROM users WHERE id = auth.uid())
                )
            );
        `);
        console.log('✅ New policies created');

        console.log('\n🎉 Migration completed successfully!');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

applyMigration();
