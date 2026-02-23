-- Add unit_id column to employees table
ALTER TABLE employees ADD COLUMN unit_id UUID REFERENCES organizational_units(id);
