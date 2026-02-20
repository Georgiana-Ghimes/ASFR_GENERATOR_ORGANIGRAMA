"""
Script to add 'consiliu' to UnitType enum
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
ALTER TYPE unittype ADD VALUE IF NOT EXISTS 'consiliu';
"""

try:
    with engine.connect() as conn:
        conn.execute(text(migration_sql))
        conn.commit()
        print("✓ Migration applied successfully: Added 'consiliu' to UnitType enum")
except Exception as e:
    print(f"✗ Migration failed: {e}")
    exit(1)
