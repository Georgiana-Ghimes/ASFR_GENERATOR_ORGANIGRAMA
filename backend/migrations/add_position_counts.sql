-- Add leadership_count and execution_count columns to organizational_units table
ALTER TABLE organizational_units 
ADD COLUMN IF NOT EXISTS leadership_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS execution_count INTEGER DEFAULT 0;

-- Set leadership_count to 1 for director_general units
UPDATE organizational_units 
SET leadership_count = 1 
WHERE unit_type = 'director_general';
