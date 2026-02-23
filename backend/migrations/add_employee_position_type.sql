-- Add position_type enum type if not exists
DO $$ BEGIN
    CREATE TYPE positiontype AS ENUM ('leadership', 'execution');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add position_type column to employees table if not exists
DO $$ BEGIN
    ALTER TABLE employees ADD COLUMN position_type positiontype;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;
