import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

# Get Consiliu de Conducere position
cur.execute("""
    SELECT custom_x, custom_y, custom_width, custom_height
    FROM organizational_units 
    WHERE stas_code = '330' AND name = 'CONSILIU DE CONDUCERE'
""")
consiliu = cur.fetchone()
print(f"Consiliu position: x={consiliu[0]}, y={consiliu[1]}, w={consiliu[2]}, h={consiliu[3]}")

# Calculate Director General position (below Consiliu)
# Consiliu is at y=180, so Director should be at y=180 + height + gap
# Default height for Consiliu is around 40-60px, let's use 60 + 40 gap = 100
director_y = consiliu[1] + 100 if consiliu[1] else 280
director_x = consiliu[0] if consiliu[0] else 600

print(f"Setting Director General to: x={director_x}, y={director_y}")

# Update Director General position
cur.execute("""
    UPDATE organizational_units 
    SET custom_x = %s, custom_y = %s
    WHERE stas_code = '1000' AND name = 'DIRECTOR GENERAL'
""", (director_x, director_y))

affected = cur.rowcount
conn.commit()

print(f"Moved Director General. Rows affected: {affected}")

cur.close()
conn.close()
