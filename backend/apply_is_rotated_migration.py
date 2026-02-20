"""
Script to add is_rotated column
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
ADD COLUMN IF NOT EXISTS is_rotated BOOLEAN DEFAULT FALSE;
"""

try:
    with engine.connect() as conn:
        conn.execute(text(migration_sql))
        conn.commit()
        print("✓ Migration applied successfully: Added is_rotated column")
except Exception as e:
    print(f"✗ Migration failed: {e}")
    exit(1)
