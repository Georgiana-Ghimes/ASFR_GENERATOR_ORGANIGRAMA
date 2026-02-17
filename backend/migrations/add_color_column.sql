-- Add color column to organizational_units table
ALTER TABLE organizational_units 
ADD COLUMN IF NOT EXISTS color VARCHAR;
