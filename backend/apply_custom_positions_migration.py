import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def apply_migration():
    conn = psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=os.getenv("DB_PORT", "5432"),
        database=os.getenv("DB_NAME", "organigrama"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", "password")
    )
    
    try:
        cursor = conn.cursor()
        
        with open('migrations/add_custom_positions.sql', 'r') as f:
            sql = f.read()
        
        cursor.execute(sql)
        conn.commit()
        
        print("✓ Migration applied successfully: add_custom_positions")
        
    except Exception as e:
        print(f"✗ Migration failed: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    apply_migration()
