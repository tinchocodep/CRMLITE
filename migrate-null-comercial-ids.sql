DO $$
DECLARE
    v_comercial_id UUID;
    v_comercial_name TEXT;
    v_null_companies INT;
    v_null_contacts INT;
BEGIN
    SELECT id, name INTO v_comercial_id, v_comercial_name
    FROM comerciales
    WHERE email = 'desarrollador@sailo.ag'
    AND is_active = true
    LIMIT 1;

    IF v_comercial_id IS NULL THEN
        RAISE EXCEPTION 'No active comercial found with email: desarrollador@sailo.ag';
    END IF;

    RAISE NOTICE 'Found comercial: % (ID: %)', v_comercial_name, v_comercial_id;

    SELECT COUNT(*) INTO v_null_companies
    FROM companies
    WHERE comercial_id IS NULL;

    SELECT COUNT(*) INTO v_null_contacts
    FROM contacts
    WHERE comercial_id IS NULL;

    RAISE NOTICE 'Companies with NULL comercial_id: %', v_null_companies;
    RAISE NOTICE 'Contacts with NULL comercial_id: %', v_null_contacts;

    IF v_null_companies = 0 AND v_null_contacts = 0 THEN
        RAISE NOTICE 'No records to migrate';
        RETURN;
    END IF;

    IF v_null_companies > 0 THEN
        UPDATE companies
        SET comercial_id = v_comercial_id
        WHERE comercial_id IS NULL;
        RAISE NOTICE 'Updated % companies', v_null_companies;
    END IF;

    IF v_null_contacts > 0 THEN
        UPDATE contacts
        SET comercial_id = v_comercial_id
        WHERE comercial_id IS NULL;
        RAISE NOTICE 'Updated % contacts', v_null_contacts;
    END IF;

    SELECT COUNT(*) INTO v_null_companies FROM companies WHERE comercial_id IS NULL;
    SELECT COUNT(*) INTO v_null_contacts FROM contacts WHERE comercial_id IS NULL;

    RAISE NOTICE 'Verification - Companies with NULL: %', v_null_companies;
    RAISE NOTICE 'Verification - Contacts with NULL: %', v_null_contacts;

    IF v_null_companies = 0 AND v_null_contacts = 0 THEN
        RAISE NOTICE 'Migration completed successfully';
    END IF;
END $$;
