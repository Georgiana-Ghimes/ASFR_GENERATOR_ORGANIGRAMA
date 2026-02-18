-- Add custom position columns to organizational_units table
ALTER TABLE organizational_units 
ADD COLUMN IF NOT EXISTS custom_x INTEGER,
ADD COLUMN IF NOT EXISTS custom_y INTEGER;
