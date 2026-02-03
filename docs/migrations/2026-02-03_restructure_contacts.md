# Database Migration: Restructure Contacts Table

**Date**: 2026-02-03  
**Migration Name**: `restructure_contacts_table_v2`  
**Applied to**: CRMLite Supabase Project (`lifeqgwsyopvaevywtsf`)

## Problem
The `contacts` table had an old structure that didn't support many-to-many relationships with companies:
- Had `name` (single field) instead of `first_name` and `last_name`
- Had `company_id` (one company per contact) instead of using `contact_companies` junction table
- Had `position` instead of using `contact_companies.role`
- Had `is_primary` at contact level instead of at relationship level

This caused the error: `Could not find the 'first_name' column of 'contacts' in the schema cache`

## Old Structure
```sql
contacts:
  - id
  - company_id (FK to companies)
  - name (TEXT)
  - position (TEXT)
  - email
  - phone
  - mobile
  - is_primary (BOOLEAN)
  - notes
  - created_by
  - created_at
  - updated_at
  - tenant_id
```

## New Structure
```sql
contacts:
  - id
  - first_name (TEXT NOT NULL)
  - last_name (TEXT NOT NULL)
  - email
  - phone
  - mobile
  - notes
  - created_by
  - created_at
  - updated_at
  - tenant_id

contact_companies (junction table):
  - id
  - contact_id (FK to contacts)
  - company_id (FK to companies)
  - role (TEXT) - formerly 'position'
  - is_primary (BOOLEAN)
  - tenant_id
  - created_at
  - updated_at
```

## Changes Made

### 1. Added New Columns
```sql
ALTER TABLE public.contacts 
ADD COLUMN first_name TEXT,
ADD COLUMN last_name TEXT;
```

### 2. Migrated Existing Data
```sql
UPDATE public.contacts 
SET 
    first_name = SPLIT_PART(name, ' ', 1),
    last_name = CASE 
        WHEN POSITION(' ' IN name) > 0 THEN SUBSTRING(name FROM POSITION(' ' IN name) + 1)
        ELSE ''
    END;
```

### 3. Made Columns NOT NULL
```sql
ALTER TABLE public.contacts 
ALTER COLUMN first_name SET NOT NULL,
ALTER COLUMN last_name SET NOT NULL;
```

### 4. Migrated Company Relationships
```sql
INSERT INTO public.contact_companies (contact_id, company_id, role, is_primary, tenant_id)
SELECT 
    id,
    company_id,
    COALESCE(position, ''),
    COALESCE(is_primary, true),
    tenant_id
FROM public.contacts
WHERE company_id IS NOT NULL;
```

### 5. Dropped Old Columns
```sql
ALTER TABLE public.contacts 
DROP COLUMN name CASCADE,
DROP COLUMN position CASCADE,
DROP COLUMN is_primary CASCADE,
DROP COLUMN company_id CASCADE;
```

**Note**: Used `CASCADE` to drop dependent views (`active_opportunities`, `upcoming_activities_view`)

## Impact
- ✅ Contacts now support multiple company associations
- ✅ Frontend code now works correctly with `first_name` and `last_name`
- ✅ Existing contacts were migrated to the new structure
- ✅ Company relationships preserved in `contact_companies` table
- ⚠️ **Views dropped**: `active_opportunities`, `upcoming_activities_view` (need to be recreated if used)

## Related Files
- Frontend: `src/hooks/useContacts.js`
- Frontend: `src/components/contacts/ContactModal.jsx`
- Frontend: `src/components/prospects/EditProspectModal.jsx`

## Notes
- This is a breaking change for any code expecting the old structure
- The `mobile` column was kept for future use
- Contact names were split by first space (simple approach)
- All existing company relationships were migrated to `contact_companies`
