import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

cur.execute("SELECT id, email, full_name, role, active FROM users")
users = cur.fetchall()

print(f"Total users: {len(users)}")
for user in users:
    print(f"  - {user[1]} (full_name: {user[2]}, role: {user[3]}, active: {user[4]})")

cur.close()
conn.close()
