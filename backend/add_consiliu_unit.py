"""
Script to add Consiliu de Conducere unit to all versions
"""
import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import DATABASE_URL
from app.models import OrgVersion, OrgUnit

# Create engine
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

def add_consiliu_to_versions():
    db = SessionLocal()
    try:
        # Get all versions
        versions = db.query(OrgVersion).all()
        
        for version in versions:
            # Check if consiliu already exists for this version
            existing_consiliu = db.query(OrgUnit).filter(
                OrgUnit.version_id == version.id,
                OrgUnit.stas_code == '330'
            ).first()
            
            if existing_consiliu:
                print(f"✓ Consiliu already exists for version {version.name}")
                continue
            
            # Create consiliu unit
            consiliu = OrgUnit(
                version_id=version.id,
                stas_code='330',
                name='CONSILIUL DE CONDUCERE',
                unit_type='consiliu',
                parent_unit_id=None,
                order_index=0,
                leadership_count=0,
                execution_count=0,
                custom_x=600,  # Default position
                custom_y=180
            )
            
            db.add(consiliu)
            print(f"✓ Added Consiliu to version {version.name}")
        
        db.commit()
        print("\n✓ Successfully added Consiliu de Conducere to all versions")
        
    except Exception as e:
        print(f"✗ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    add_consiliu_to_versions()
