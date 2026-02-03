# Database Migration: Add Status to companies_full View

**Date**: 2026-02-03  
**Migration Name**: `add_status_to_companies_full_view_v2`  
**Applied to**: CRMLite Supabase Project (`lifeqgwsyopvaevywtsf`)

## Problem
The `companies_full` view did not include the `status` column, causing the frontend to always display "Contacto Inicial" as the default status instead of showing the actual prospect status from the database.

## Root Cause
When the `status` column was added to the `companies` table, the `companies_full` view was not updated to include it. The view uses `c.*` which should include all columns, but the view needed to be recreated to pick up the new column.

## Changes Made

### Recreated companies_full View
```sql
DROP VIEW IF EXISTS public.companies_full CASCADE;

CREATE OR REPLACE VIEW public.companies_full AS
SELECT 
    c.*,  -- This now includes the status column
    co.name AS comercial_name,
    co.email AS comercial_email,
    COUNT(DISTINCT cc.contact_id) AS total_contacts,
    COUNT(DISTINCT o.id) AS total_opportunities,
    COUNT(DISTINCT CASE WHEN o.status IN ('prospecting', 'qualification', 'proposal', 'negotiation') THEN o.id END) AS active_opportunities,
    COALESCE(SUM(CASE WHEN o.status IN ('prospecting', 'qualification', 'proposal', 'negotiation') THEN o.amount ELSE 0 END), 0) AS pipeline_value,
    COUNT(DISTINCT s.id) AS total_segments,
    COALESCE(SUM(s.hectares), 0) AS total_hectares
FROM companies c
LEFT JOIN comerciales co ON c.comercial_id = co.id
LEFT JOIN contact_companies cc ON c.id = cc.company_id
LEFT JOIN opportunities o ON c.id = o.company_id
LEFT JOIN segments s ON c.id = s.company_id
GROUP BY c.id, co.name, co.email;
```

## Impact
- ✅ The `companies_full` view now includes the `status` column
- ✅ Frontend will correctly display the actual prospect status (Contacto Inicial / Cotizado / Cierre Cercano)
- ✅ No more hardcoded "Contacto Inicial" fallback when status exists in the database

## Verification
```sql
SELECT id, trade_name, status, company_type 
FROM companies_full 
WHERE company_type = 'prospect';
```

Expected result: Shows the actual `status` value for each prospect.

## Related Files
- Frontend: `src/components/prospects/ProspectCard.jsx` (line 33)
- Frontend: `src/hooks/useCompanies.js` (uses `companies_full` view)

## Notes
- The view uses `c.*` which automatically includes all columns from the `companies` table
- When adding new columns to `companies`, the view should be recreated to pick them up
- Fixed column name from `estimated_value` to `amount` in opportunities aggregation
