-- Update segments structure in companies table
-- Change from: {name, hectares, crops, machinery}
-- To: {name, location, campaign, hectares, crop_type}

-- Note: segments is a JSONB column, so we don't need to alter the column itself
-- We just need to update the application logic to use the new structure

-- Add a comment to document the new structure
COMMENT ON COLUMN companies.segments IS 
'Array of productive units (JSONB). Each unit contains:
- name: string (unit name)
- location: string (physical location)
- campaign: string (agricultural campaign/season)
- hectares: number (size in hectares)
- crop_type: string (type of crop)';
