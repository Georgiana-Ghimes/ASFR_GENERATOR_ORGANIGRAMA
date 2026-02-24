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

# Reset ALL custom positions to NULL (auto-position)
cur.execute("""
    UPDATE organizational_units 
    SET custom_x = NULL, custom_y = NULL
    WHERE version_id = %s
""", (version_id,))

affected = cur.rowcount
conn.commit()

print(f"Reset all custom positions. Rows affected: {affected}")

cur.close()
conn.close()
