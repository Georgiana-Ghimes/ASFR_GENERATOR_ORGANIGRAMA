import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def apply_migration():
    # Get database URL from environment
    db_url = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/organigrama")
    
    # Parse connection string
    # Format: postgresql://user:password@host:port/database
    parts = db_url.replace("postgresql://", "").split("@")
    user_pass = parts[0].split(":")
    host_port_db = parts[1].split("/")
    host_port = host_port_db[0].split(":")
    
    conn = psycopg2.connect(
        host=host_port[0],
        port=host_port[1] if len(host_port) > 1 else "5432",
        database=host_port_db[1],
        user=user_pass[0],
        password=user_pass[1]
    )
    
    cursor = conn.cursor()
    
    # Read and execute migration
    with open("migrations/add_custom_height.sql", "r") as f:
        sql = f.read()
        cursor.execute(sql)
    
    conn.commit()
    cursor.close()
    conn.close()
    
    print("✓ Migration applied: custom_height column added")

if __name__ == "__main__":
    apply_migration()
