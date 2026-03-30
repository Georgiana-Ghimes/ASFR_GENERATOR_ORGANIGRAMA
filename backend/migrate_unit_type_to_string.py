"""Migrate unit_type column from enum to varchar"""
from app.database import SessionLocal
import sqlalchemy

db = SessionLocal()
db.execute(sqlalchemy.text(
    "ALTER TABLE organizational_units ALTER COLUMN unit_type TYPE VARCHAR USING unit_type::text"
))
db.commit()
print("Migration done: unit_type is now VARCHAR")
db.close()
