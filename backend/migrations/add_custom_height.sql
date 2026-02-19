-- Add custom_height column to organizational_units table
-- This allows manual resizing of unit boxes in the org chart

ALTER TABLE organizational_units 
ADD COLUMN IF NOT EXISTS custom_height INTEGER;

ALTER TABLE organizational_units 
ADD COLUMN IF NOT EXISTS custom_width INTEGER;

-- Add comments
COMMENT ON COLUMN organizational_units.custom_height IS 'Custom height in pixels (must be multiple of 20 for grid alignment)';
COMMENT ON COLUMN organizational_units.custom_width IS 'Custom width in pixels (must be multiple of 20 for grid alignment)';
