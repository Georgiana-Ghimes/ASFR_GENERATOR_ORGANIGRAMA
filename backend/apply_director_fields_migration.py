"""
Script to add director_title and director_name columns and populate director_general units
"""
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("ERROR: DATABASE_URL not found in environment variables")
    exit(1)

engine = create_engine(DATABASE_URL)

migration_sql = """
ALTER TABLE organizational_units 
ADD COLUMN IF NOT EXISTS director_title VARCHAR;

ALTER TABLE organizational_units 
ADD COLUMN IF NOT EXISTS director_name VARCHAR;

-- Update existing director_general units with default values
UPDATE organizational_units 
SET director_title = 'DIRECTOR GENERAL',
    director_name = 'Petru BOGDAN'
WHERE unit_type = 'director_general' 
  AND (director_title IS NULL OR director_name IS NULL);
"""

try:
    with engine.connect() as conn:
        conn.execute(text(migration_sql))
        conn.commit()
        print("✓ Migration applied successfully: Added director_title and director_name columns")
        print("✓ Updated existing director_general units with default values")
except Exception as e:
    print(f"✗ Migration failed: {e}")
    exit(1)
