#!/usr/bin/env python3
"""Apply unit types table migration"""

from app.database import engine
from sqlalchemy import text

def apply_migration():
    with open('migrations/add_unit_types_table.sql', 'r', encoding='utf-8') as f:
        sql = f.read()
    
    with engine.connect() as conn:
        conn.execute(text(sql))
        conn.commit()
    
    print("✓ Unit types table migration applied successfully")

if __name__ == "__main__":
    apply_migration()
