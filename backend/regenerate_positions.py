"""
Script to regenerate positions for all existing units
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from app.models import OrgUnit, Position

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("ERROR: DATABASE_URL not found in environment variables")
    exit(1)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

try:
    # Get all units
    units = db.query(OrgUnit).all()
    
    print(f"Found {len(units)} units")
    
    for unit in units:
        # Delete existing positions for this unit
        db.query(Position).filter(Position.unit_id == unit.id).delete()
        
        # Create leadership positions
        for i in range(unit.leadership_count or 0):
            position_titles = {
                'director_general': 'Director General',
                'directie': 'Director',
                'serviciu': 'Șef Serviciu',
                'inspectorat': 'Inspector Șef Teritorial',
                'compartiment': 'Șef Compartiment',
                'birou': 'Șef Birou'
            }
            
            title = position_titles.get(unit.unit_type, 'Post conducere')
            if (unit.leadership_count or 0) > 1:
                title = f'{title} {i + 1}'
            
            leadership_position = Position(
                version_id=unit.version_id,
                unit_id=unit.id,
                title=title,
                is_leadership=True,
                is_vacant=True,
                order_index=i
            )
            db.add(leadership_position)
        
        # Create execution positions
        for i in range(unit.execution_count or 0):
            execution_position = Position(
                version_id=unit.version_id,
                unit_id=unit.id,
                title=f'Post execuție {i + 1}',
                is_leadership=False,
                is_vacant=True,
                order_index=i
            )
            db.add(execution_position)
        
        print(f"✓ Regenerated positions for {unit.name}: {unit.leadership_count or 0} leadership + {unit.execution_count or 0} execution")
    
    db.commit()
    print(f"\n✓ Successfully regenerated positions for all {len(units)} units")
    
except Exception as e:
    print(f"✗ Error: {e}")
    db.rollback()
    exit(1)
finally:
    db.close()
