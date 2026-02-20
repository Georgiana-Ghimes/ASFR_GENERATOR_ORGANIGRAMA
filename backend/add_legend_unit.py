"""
Script to add Legend unit to all versions
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

def add_legend_to_versions():
    db = SessionLocal()
    try:
        # Get all versions
        versions = db.query(OrgVersion).all()
        
        for version in versions:
            # Check if legend already exists for this version
            existing_legend = db.query(OrgUnit).filter(
                OrgUnit.version_id == version.id,
                OrgUnit.unit_type == 'legend'
            ).first()
            
            if existing_legend:
                print(f"✓ Legend already exists for version {version.name}")
                continue
            
            # Create legend unit
            legend = OrgUnit(
                version_id=version.id,
                stas_code='LEGEND',
                name='Legendă',
                unit_type='legend',
                parent_unit_id=None,
                order_index=0,
                leadership_count=0,
                execution_count=0,
                legend_col1='NUMĂR POSTURI CONDUCERE',
                legend_col2='TOTAL POSTURI INCLUS CONDUCERE',
                legend_col3='DENUMIRE STRUCTURĂ',
                custom_x=450,  # Default position
                custom_y=20
            )
            
            db.add(legend)
            print(f"✓ Added Legend to version {version.name}")
        
        db.commit()
        print("\n✓ Successfully added Legend to all versions")
        
    except Exception as e:
        print(f"✗ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    add_legend_to_versions()
