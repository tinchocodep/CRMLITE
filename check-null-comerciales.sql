-- Step 1: Get the comercial ID for desarrollador@sailo.ag
SELECT id, name, email 
FROM comerciales 
WHERE email = 'desarrollador@sailo.ag' 
AND is_active = true;

-- Step 2: Count affected records
SELECT 
    (SELECT COUNT(*) FROM companies WHERE comercial_id IS NULL) as null_companies,
    (SELECT COUNT(*) FROM contacts WHERE comercial_id IS NULL) as null_contacts;

-- Step 3: Preview affected companies
SELECT id, name, company_type, created_at
FROM companies
WHERE comercial_id IS NULL
LIMIT 10;

-- Step 4: Preview affected contacts
SELECT id, name, email, created_at
FROM contacts
WHERE comercial_id IS NULL
LIMIT 10;
