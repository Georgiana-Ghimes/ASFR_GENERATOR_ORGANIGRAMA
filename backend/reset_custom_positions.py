#!/usr/bin/env python3
"""Reset all custom positions for a version"""

from app.database import SessionLocal
from app.models import OrgUnit, OrgVersion

def reset_positions():
    db = SessionLocal()
    
    try:
        # Get the version
        version = db.query(OrgVersion).filter(
            OrgVersion.version_number == "49/23.01.2026"
        ).first()
        
        if not version:
            print("Version not found!")
            return
        
        print(f"Found version: {version.name}")
        
        # Get all units for this version
        units = db.query(OrgUnit).filter(OrgUnit.version_id == version.id).all()
        
        reset_count = 0
        for unit in units:
            if unit.custom_x is not None or unit.custom_y is not None:
                reset_count += 1
                print(f"Resetting {unit.stas_code} - {unit.name}")
            
            unit.custom_x = None
            unit.custom_y = None
            unit.custom_width = None
            unit.custom_height = None
        
        db.commit()
        print(f"\n✓ Reset {reset_count} units with custom positions")
        
    finally:
        db.close()

if __name__ == "__main__":
    reset_positions()
