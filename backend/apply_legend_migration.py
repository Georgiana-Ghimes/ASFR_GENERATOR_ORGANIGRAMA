"""
Script to add legend unit type and columns, then create legend units
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
-- Add 'legend' to enum
ALTER TYPE unittype ADD VALUE IF NOT EXISTS 'legend';

-- Add legend columns
ALTER TABLE organizational_units 
ADD COLUMN IF NOT EXISTS legend_col1 VARCHAR;

ALTER TABLE organizational_units 
ADD COLUMN IF NOT EXISTS legend_col2 VARCHAR;

ALTER TABLE organizational_units 
ADD COLUMN IF NOT EXISTS legend_col3 VARCHAR;
"""

try:
    with engine.connect() as conn:
        conn.execute(text(migration_sql))
        conn.commit()
        print("✓ Migration applied successfully: Added 'legend' to UnitType enum and legend columns")
except Exception as e:
    print(f"✗ Migration failed: {e}")
    exit(1)
