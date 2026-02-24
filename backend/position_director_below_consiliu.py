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

# Get Consiliu position
cur.execute("""
    SELECT custom_x, custom_y, custom_width, custom_height
    FROM organizational_units 
    WHERE version_id = %s AND stas_code = '330'
""", (version_id,))
consiliu = cur.fetchone()

# Calculate Director General position
# Consiliu is at y=180, height is around 60px
# Director should be at y = 180 + 60 + 40 (gap) = 280
consiliu_x = consiliu[0] if consiliu[0] else 600
consiliu_y = consiliu[1] if consiliu[1] else 180

director_x = consiliu_x  # Same X as Consiliu (centered)
director_y = consiliu_y + 100  # Below Consiliu with gap

print(f"Consiliu position: x={consiliu_x}, y={consiliu_y}")
print(f"Setting Director General to: x={director_x}, y={director_y}")

# Update Director General position
cur.execute("""
    UPDATE organizational_units 
    SET custom_x = %s, custom_y = %s
    WHERE version_id = %s AND stas_code = '1000'
""", (director_x, director_y, version_id))

affected = cur.rowcount
conn.commit()

print(f"Moved Director General. Rows affected: {affected}")

cur.close()
conn.close()
