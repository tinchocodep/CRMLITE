# Database Migration: Fix Comercial ID Constraint

**Date**: 2026-02-03  
**Migration Names**: 
- `fix_comercial_id_constraint`
- `create_comercial_records_for_users`

**Applied to**: CRMLite Supabase Project (`lifeqgwsyopvaevywtsf`)

## Problem
Users had `comercial_id` references but the `comerciales` table was missing corresponding records, causing foreign key constraint violations when creating companies:

```
Error: insert or update on table "companies" violates foreign key constraint "companies_comercial_id_fkey"
```

## Root Cause
- Users table had references to `comercial_id` (1 and 2)
- The `comerciales` table was empty
- The `companies.comercial_id` column was NOT NULL, requiring a valid comercial reference

## Changes Made

### Migration 1: fix_comercial_id_constraint

#### 1. Created Initial Comercial Record
```sql
INSERT INTO public.comerciales (id, name, email, is_active, tenant_id)
VALUES (1, 'Comercial Principal', 'admin@sailo.com', true, 1)
ON CONFLICT (id) DO NOTHING;
```

#### 2. Made comercial_id Nullable
```sql
ALTER TABLE public.companies 
ALTER COLUMN comercial_id DROP NOT NULL;
```

### Migration 2: create_comercial_records_for_users

#### 1. Updated Comercial Record for Admin User
```sql
UPDATE public.comerciales 
SET user_id = '48b99528-0ad3-4971-ac32-e725995c3ec1',
    name = 'Admin SAILO',
    email = 'admin@sailo.com'
WHERE id = 1;
```

#### 2. Created Comercial Record for Martin User
```sql
INSERT INTO public.comerciales (id, user_id, name, email, is_active, tenant_id)
VALUES (
    2,
    'e491b97c-4db3-4076-91ff-6918141e78a3',
    'Martin',
    'tinchocabrera100@gmail.com',
    true,
    1
);
```

## Final State

### Comerciales Table
| ID | Name | Email | user_id (UUID) |
|----|------|-------|----------------|
| 1 | Admin SAILO | admin@sailo.com | 48b99528-0ad3-4971-ac32-e725995c3ec1 |
| 2 | Martin | tinchocabrera100@gmail.com | e491b97c-4db3-4076-91ff-6918141e78a3 |

### Users Table
| user_id (UUID) | Email | comercial_id |
|----------------|-------|--------------|
| 48b99528-0ad3-4971-ac32-e725995c3ec1 | admin@sailo.com | 1 |
| e491b97c-4db3-4076-91ff-6918141e78a3 | tinchocabrera100@gmail.com | 2 |

## Impact
- ✅ Each user now has a corresponding comercial record
- ✅ The `user_id` in `comerciales` links back to the `users` table
- ✅ Companies can be created and assigned to the correct comercial
- ✅ Future companies can be created without assigning a comercial (nullable field)

## Related Tables
- `companies` - Now has nullable `comercial_id`
- `comerciales` - Now has records for all users
- `users` - Each user has a valid `comercial_id` reference

## Notes
- The `comercial_id` field is now optional for companies
- Each active user should have a corresponding comercial record
- The `user_id` in `comerciales` creates a bidirectional relationship with `users`

