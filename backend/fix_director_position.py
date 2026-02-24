import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

# Reset Director General position to NULL (auto-position)
cur.execute("""
    UPDATE organizational_units 
    SET custom_x = NULL, custom_y = NULL
    WHERE stas_code = '1000' AND name = 'DIRECTOR GENERAL'
""")

affected = cur.rowcount
conn.commit()

print(f"Reset Director General position. Rows affected: {affected}")

cur.close()
conn.close()
