import psycopg2
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def apply_migration():
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    
    try:
        with open("migrations/add_employee_position_type.sql", "r") as f:
            sql = f.read()
        
        cur.execute(sql)
        conn.commit()
        print("Migration applied successfully!")
    except Exception as e:
        conn.rollback()
        print(f"Error applying migration: {e}")
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    apply_migration()
