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

# Check Director General unit_type
cur.execute("""
    SELECT id, stas_code, name, unit_type, custom_x, custom_y
    FROM organizational_units 
    WHERE version_id = %s AND stas_code = '1000'
""", (version_id,))

director = cur.fetchone()
print(f"Director General:")
print(f"  ID: {director[0]}")
print(f"  Code: {director[1]}")
print(f"  Name: {director[2]}")
print(f"  Type: {director[3]}")
print(f"  Position: x={director[4]}, y={director[5]}")

# Check Consiliu
cur.execute("""
    SELECT id, stas_code, name, unit_type, custom_x, custom_y
    FROM organizational_units 
    WHERE version_id = %s AND stas_code = '330'
""", (version_id,))

consiliu = cur.fetchone()
print(f"\nConsiliu de Conducere:")
print(f"  ID: {consiliu[0]}")
print(f"  Code: {consiliu[1]}")
print(f"  Name: {consiliu[2]}")
print(f"  Type: {consiliu[3]}")
print(f"  Position: x={consiliu[4]}, y={consiliu[5]}")

# Check Legend
cur.execute("""
    SELECT id, stas_code, name, unit_type, custom_x, custom_y
    FROM organizational_units 
    WHERE version_id = %s AND unit_type = 'legend'
""", (version_id,))

legend = cur.fetchone()
if legend:
    print(f"\nLegend:")
    print(f"  ID: {legend[0]}")
    print(f"  Code: {legend[1]}")
    print(f"  Name: {legend[2]}")
    print(f"  Type: {legend[3]}")
    print(f"  Position: x={legend[4]}, y={legend[5]}")

cur.close()
conn.close()
