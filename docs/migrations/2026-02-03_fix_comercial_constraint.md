# Database Migration: Fix Comercial ID Constraint

**Date**: 2026-02-03  
**Migration Name**: `fix_comercial_id_constraint`  
**Applied to**: CRMLite Supabase Project (`lifeqgwsyopvaevywtsf`)

## Problem
Users had `comercial_id = 1` but the `comerciales` table was empty, causing foreign key constraint violations when creating companies:

```
Error: insert or update on table "companies" violates foreign key constraint "companies_comercial_id_fkey"
```

## Root Cause
- Users table had references to `comercial_id = 1`
- The `comerciales` table had no records
- The `companies.comercial_id` column was NOT NULL, requiring a valid comercial reference

## Changes Made

### 1. Created Missing Comercial Record
```sql
INSERT INTO public.comerciales (id, name, email, is_active, tenant_id)
VALUES (1, 'Comercial Principal', 'admin@sailo.com', true, 1)
ON CONFLICT (id) DO NOTHING;
```

### 2. Made comercial_id Nullable
```sql
ALTER TABLE public.companies 
ALTER COLUMN comercial_id DROP NOT NULL;
```

### 3. Added Documentation
```sql
COMMENT ON COLUMN public.companies.comercial_id IS 'Optional reference to the comercial (sales rep) assigned to this company. Can be null if not assigned yet.';
```

## Impact
- ✅ Existing users can now create companies without errors
- ✅ Future companies can be created without assigning a comercial
- ✅ The comercial can be assigned later when needed

## Related Tables
- `companies` - Now has nullable `comercial_id`
- `comerciales` - Now has the default comercial record (id=1)
- `users` - References `comercial_id = 1`

## Notes
- The `comercial_id` field is now optional for companies
- If a user has a `comercial_id`, it will be used automatically
- If not specified, the company will be created without a comercial assignment
