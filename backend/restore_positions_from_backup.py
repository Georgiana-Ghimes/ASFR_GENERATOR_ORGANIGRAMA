import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# Pozițiile custom care funcționau bine (din backup)
positions = {
    '1000': (1580, -20, 380, 60),  # Director General - va fi ignorat de zoom
    '330': (600, 180, None, None),  # Consiliu
    'LEGEND': (420, 20, None, None),  # Legend
    '1001': (280, 180, 280, 40),
    '1002': (280, 240, 280, 40),
    '1010': (1340, 300, 280, 40),
    '1011': (1660, 300, 300, 40),
    '1012': (1660, 360, 300, 40),
    '1020': (1340, 180, 280, 40),
    '1021': (1660, 180, 300, 40),
    '1022': (1660, 240, 300, 40),
    '1030': (580, 300, 280, 40),
    '1031': (280, 300, 280, 40),
    '1040': (1340, 420, 280, 40),
    '1051': (1660, 480, 300, 40),
    '1052': (1660, 540, 300, 40),
    '1100': (460, 620, 340, 60),
    '1101': (480, 1060, 240, 40),
    '1102': (560, 1060, 240, 40),
    '1103': (640, 1060, 240, 40),
    '1120': (400, 820, 240, 40),
    '1200': (900, 620, 360, 60),
    '1210': (900, 820, 260, 60),
    '1220': (1020, 820, 260, 60),
    '2000': (1360, 620, 540, 60),
    '2001': (1280, 1040, 220, 80),
    '2010': (1360, 800, 220, 60),
    '2020': (1440, 800, 220, 60),
    '2030': (1520, 800, 220, 60),
    '2031': (1500, 1040, 220, 80),
    '2040': (1600, 800, 220, 60),
    '2041': (1620, 1040, 220, 80),
    '2050': (1680, 800, 220, 60),
    '2060': (1760, 800, 220, 60),
    '3000': (1940, 620, 340, 60),
    '3001': (1880, 800, 220, 60),
    '3002': (1960, 800, 220, 60),
    '3003': (2040, 800, 220, 60),
    '3004': (2120, 800, 220, 60),
}

conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

# Get the latest version
cur.execute("SELECT id FROM org_versions ORDER BY created_date DESC LIMIT 1")
version_id = cur.fetchone()[0]

count = 0
for stas_code, (x, y, w, h) in positions.items():
    cur.execute("""
        UPDATE organizational_units 
        SET custom_x = %s, custom_y = %s, custom_width = %s, custom_height = %s
        WHERE version_id = %s AND stas_code = %s
    """, (x, y, w, h, version_id, stas_code))
    if cur.rowcount > 0:
        count += 1

conn.commit()
print(f"Restored {count} custom positions")

cur.close()
conn.close()
