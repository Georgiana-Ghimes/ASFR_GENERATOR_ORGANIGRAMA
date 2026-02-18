from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from app.database import get_db
from app.models import OrgUnit, OrgVersion, User, Position
from app.schemas import OrgUnit as OrgUnitSchema, OrgUnitCreate, OrgUnitUpdate
from app.auth import get_current_user, require_role

router = APIRouter()

@router.get("/", response_model=List[OrgUnitSchema])
def list_units(
    version_id: Optional[UUID] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(OrgUnit)
    if version_id:
        query = query.filter(OrgUnit.version_id == version_id)
    return query.order_by(OrgUnit.order_index).all()

@router.get("/{unit_id}", response_model=OrgUnitSchema)
def get_unit(
    unit_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    unit = db.query(OrgUnit).filter(OrgUnit.id == unit_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")
    return unit

@router.post("/", response_model=OrgUnitSchema)
def create_unit(
    unit_data: OrgUnitCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("editor"))
):
    # Check version exists and is draft
    version = db.query(OrgVersion).filter(OrgVersion.id == unit_data.version_id).first()
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
    if version.status != "draft":
        raise HTTPException(status_code=400, detail="Cannot modify non-draft version")
    
    # Check code uniqueness within version
    existing = db.query(OrgUnit).filter(
        OrgUnit.version_id == unit_data.version_id,
        OrgUnit.stas_code == unit_data.stas_code
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="STAS code already exists in this version")
    
    # For director_general, force leadership_count to 1
    unit_dict = unit_data.model_dump()
    if unit_dict['unit_type'] == 'director_general':
        unit_dict['leadership_count'] = 1
        unit_dict['execution_count'] = 0
    
    unit = OrgUnit(**unit_dict)
    db.add(unit)
    db.flush()  # Get the unit ID before committing
    
    # Create positions based on counts
    # Leadership positions
    for i in range(unit.leadership_count):
        position_titles = {
            'director_general': 'Director General',
            'directie': 'Director',
            'serviciu': 'Șef Serviciu',
            'inspectorat': 'Inspector Șef Teritorial',
            'compartiment': 'Șef Compartiment',
            'birou': 'Șef Birou'
        }
        
        title = position_titles.get(unit.unit_type, 'Post conducere')
        if unit.leadership_count > 1:
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
    
    # Execution positions
    for i in range(unit.execution_count):
        execution_position = Position(
            version_id=unit.version_id,
            unit_id=unit.id,
            title=f'Post execuție {i + 1}',
            is_leadership=False,
            is_vacant=True,
            order_index=i
        )
        db.add(execution_position)
    
    db.commit()
    db.refresh(unit)
    return unit

@router.put("/{unit_id}", response_model=OrgUnitSchema)
def update_unit(
    unit_id: UUID,
    unit_data: OrgUnitUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("editor"))
):
    unit = db.query(OrgUnit).filter(OrgUnit.id == unit_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")
    
    # Check version is draft
    version = db.query(OrgVersion).filter(OrgVersion.id == unit.version_id).first()
    if version.status != "draft":
        raise HTTPException(status_code=400, detail="Cannot modify non-draft version")
    
    # Track old counts
    old_leadership_count = unit.leadership_count
    old_execution_count = unit.execution_count
    
    # Track if parent changed
    old_parent_id = unit.parent_unit_id
    new_parent_id = unit_data.parent_unit_id if hasattr(unit_data, 'parent_unit_id') and unit_data.parent_unit_id is not None else old_parent_id
    
    # Update unit fields
    for key, value in unit_data.model_dump(exclude_unset=True).items():
        setattr(unit, key, value)
    
    # For director_general, force leadership_count to 1
    if unit.unit_type == 'director_general':
        unit.leadership_count = 1
        unit.execution_count = 0
    
    # Handle position count changes
    new_leadership_count = unit.leadership_count
    new_execution_count = unit.execution_count
    
    # Update leadership positions
    if new_leadership_count != old_leadership_count:
        # Delete all existing leadership positions
        db.query(Position).filter(
            Position.unit_id == unit.id,
            Position.is_leadership == True
        ).delete()
        
        # Create new leadership positions
        for i in range(new_leadership_count):
            position_titles = {
                'director_general': 'Director General',
                'directie': 'Director',
                'serviciu': 'Șef Serviciu',
                'inspectorat': 'Inspector Șef Teritorial',
                'compartiment': 'Șef Compartiment',
                'birou': 'Șef Birou'
            }
            
            title = position_titles.get(unit.unit_type, 'Post conducere')
            if new_leadership_count > 1:
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
    
    # Update execution positions
    if new_execution_count != old_execution_count:
        # Delete all existing execution positions
        db.query(Position).filter(
            Position.unit_id == unit.id,
            Position.is_leadership == False
        ).delete()
        
        # Create new execution positions
        for i in range(new_execution_count):
            execution_position = Position(
                version_id=unit.version_id,
                unit_id=unit.id,
                title=f'Post execuție {i + 1}',
                is_leadership=False,
                is_vacant=True,
                order_index=i
            )
            db.add(execution_position)
    
    # Handle parent change (no longer needed since we don't auto-add positions to parent)
    
    db.commit()
    db.refresh(unit)
    return unit

@router.patch("/{unit_id}", response_model=OrgUnitSchema)
def patch_unit(
    unit_id: UUID,
    unit_data: OrgUnitUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("editor"))
):
    """Partial update for unit - used for drag & drop position updates"""
    unit = db.query(OrgUnit).filter(OrgUnit.id == unit_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")
    
    # Check version is draft
    version = db.query(OrgVersion).filter(OrgVersion.id == unit.version_id).first()
    if version.status != "draft":
        raise HTTPException(status_code=400, detail="Cannot modify non-draft version")
    
    # Update only provided fields
    update_data = unit_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(unit, key, value)
    
    db.commit()
    db.refresh(unit)
    return unit

@router.delete("/{unit_id}")
def delete_unit(
    unit_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("editor"))
):
    unit = db.query(OrgUnit).filter(OrgUnit.id == unit_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")
    
    # Check version is draft
    version = db.query(OrgVersion).filter(OrgVersion.id == unit.version_id).first()
    if version.status != "draft":
        raise HTTPException(status_code=400, detail="Cannot delete from non-draft version")
    
    # Positions will be deleted automatically due to cascade
    db.delete(unit)
    db.commit()
    return {"message": "Unit deleted"}
