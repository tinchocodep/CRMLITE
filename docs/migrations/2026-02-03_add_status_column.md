# Database Migration: Add Status Column to Companies

**Date**: 2026-02-03  
**Migration Name**: `add_status_column_to_companies`  
**Applied to**: CRMLite Supabase Project (`lifeqgwsyopvaevywtsf`)

## Purpose
Add a `status` column to the `companies` table to track prospect progression through the sales pipeline.

## Changes Made

### 1. Added Column
```sql
ALTER TABLE public.companies 
ADD COLUMN status TEXT;
```

### 2. Added Constraint
```sql
ALTER TABLE public.companies
ADD CONSTRAINT companies_status_check 
CHECK (status IS NULL OR status IN ('contacted', 'quoted', 'near_closing'));
```

### 3. Added Documentation
```sql
COMMENT ON COLUMN public.companies.status IS 'Prospect status: contacted (initial contact), quoted (quote sent), near_closing (close to conversion). Only applicable when company_type = prospect';
```

### 4. Set Default Values
```sql
UPDATE public.companies 
SET status = 'contacted' 
WHERE company_type = 'prospect' AND status IS NULL;
```

## Status Values

| Value | Label | Description | Icon |
|-------|-------|-------------|------|
| `contacted` | Contacto Inicial | Initial contact made with prospect | 🧊 (logo_frio.png) |
| `quoted` | Cotizado | Quote/proposal sent to prospect | 🔥 (logo_tibio.png) |
| `near_closing` | Cierre Cercano | Close to converting to client | 🚨 (logo_urgente.png) |

## Notes
- The `status` field is **nullable** to allow for clients (where status doesn't apply)
- Only prospects should have a status value
- The constraint ensures data integrity by limiting values to the three valid options
- Existing prospects were automatically set to 'contacted' status

## Related Files
- Frontend: `src/components/prospects/EditProspectModal.jsx`
- Frontend: `src/pages/Prospects.jsx`
- Frontend: `src/layouts/MainLayout.jsx`
