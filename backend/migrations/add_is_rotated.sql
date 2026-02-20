-- Add is_rotated column to organizational_units table
ALTER TABLE organizational_units 
ADD COLUMN IF NOT EXISTS is_rotated BOOLEAN DEFAULT FALSE;
