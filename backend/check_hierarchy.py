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

# Check hierarchy
cur.execute("""
    SELECT id, stas_code, name, unit_type, parent_unit_id
    FROM organizational_units 
    WHERE version_id = %s
    ORDER BY stas_code
    LIMIT 10
""", (version_id,))

units = cur.fetchall()

print(f"First 10 units:")
for unit in units:
    print(f"  Code: {unit[1]}, Type: {unit[3]}, Parent: {unit[4]}")

# Count units by parent
cur.execute("""
    SELECT parent_unit_id, COUNT(*)
    FROM organizational_units 
    WHERE version_id = %s
    GROUP BY parent_unit_id
    ORDER BY COUNT(*) DESC
""", (version_id,))

parents = cur.fetchall()
print(f"\nUnits by parent:")
for parent in parents[:10]:
    print(f"  Parent: {parent[0]}, Children: {parent[1]}")

cur.close()
conn.close()
