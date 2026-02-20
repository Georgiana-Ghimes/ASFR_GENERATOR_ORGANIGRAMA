-- Add director_title and director_name columns to organizational_units table
ALTER TABLE organizational_units 
ADD COLUMN IF NOT EXISTS director_title VARCHAR;

ALTER TABLE organizational_units 
ADD COLUMN IF NOT EXISTS director_name VARCHAR;
