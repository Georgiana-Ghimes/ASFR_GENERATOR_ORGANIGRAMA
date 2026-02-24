import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

with open('migrations/add_validity_dates.sql', 'r') as f:
    sql = f.read()
    cur.execute(sql)

conn.commit()
cur.close()
conn.close()

print("Validity dates migration applied successfully!")
