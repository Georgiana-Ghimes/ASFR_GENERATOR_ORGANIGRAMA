import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

# Get the latest version
cur.execute("SELECT id, version_number, name FROM org_versions ORDER BY created_date DESC LIMIT 1")
version = cur.fetchone()
print(f"Latest version: {version[1]} - {version[2]}")
print(f"Version ID: {version[0]}\n")

# Get units with custom positions
cur.execute("""
    SELECT id, stas_code, name, custom_x, custom_y, custom_width, custom_height 
    FROM organizational_units 
    WHERE version_id = %s AND (custom_x IS NOT NULL OR custom_y IS NOT NULL)
    ORDER BY custom_y DESC, custom_x DESC
""", (version[0],))

units = cur.fetchall()

print(f"Units with custom positions: {len(units)}\n")
for unit in units:
    print(f"ID: {unit[0]}")
    print(f"  Code: {unit[1]}")
    print(f"  Name: {unit[2]}")
    print(f"  Position: x={unit[3]}, y={unit[4]}")
    print(f"  Size: w={unit[5]}, h={unit[6]}")
    print()

cur.close()
conn.close()
