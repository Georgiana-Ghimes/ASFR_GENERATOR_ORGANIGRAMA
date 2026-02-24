import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

# Get the latest version
cur.execute("SELECT id FROM org_versions ORDER BY created_date DESC LIMIT 1")
version_id = cur.fetchone()[0]

# Check units with no parent
cur.execute("""
    SELECT id, stas_code, name, unit_type
    FROM organizational_units 
    WHERE version_id = %s AND parent_unit_id IS NULL
""", (version_id,))

roots = cur.fetchall()

print(f"Units with no parent (roots): {len(roots)}")
for root in roots:
    print(f"  Code: {root[1]}, Name: {root[2]}, Type: {root[3]}")

cur.close()
conn.close()
