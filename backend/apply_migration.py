"""
Script to apply the chart_title migration
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
ALTER TABLE org_versions 
ADD COLUMN IF NOT EXISTS chart_title VARCHAR DEFAULT 'CODIFICAREA STRUCTURILOR DIN ANEXA LA OMTI NR. 48/23.01.2026';
"""

try:
    with engine.connect() as conn:
        conn.execute(text(migration_sql))
        conn.commit()
        print("✓ Migration applied successfully: Added chart_title column to org_versions table")
except Exception as e:
    print(f"✗ Migration failed: {e}")
    exit(1)
