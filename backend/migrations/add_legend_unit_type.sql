-- Add 'legend' value to UnitType enum
ALTER TYPE unittype ADD VALUE IF NOT EXISTS 'legend';

-- Add legend columns to organizational_units table
ALTER TABLE organizational_units 
ADD COLUMN IF NOT EXISTS legend_col1 VARCHAR;

ALTER TABLE organizational_units 
ADD COLUMN IF NOT EXISTS legend_col2 VARCHAR;

ALTER TABLE organizational_units 
ADD COLUMN IF NOT EXISTS legend_col3 VARCHAR;
