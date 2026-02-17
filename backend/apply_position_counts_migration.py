"""
Script to apply the position counts migration
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
ADD COLUMN IF NOT EXISTS leadership_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS execution_count INTEGER DEFAULT 0;

UPDATE organizational_units 
SET leadership_count = 1 
WHERE unit_type = 'director_general';
"""

try:
    with engine.connect() as conn:
        conn.execute(text(migration_sql))
        conn.commit()
        print("✓ Migration applied successfully: Added leadership_count and execution_count columns")
except Exception as e:
    print(f"✗ Migration failed: {e}")
    exit(1)
