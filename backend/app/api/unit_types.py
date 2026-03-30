from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.database import get_db
from app.models import UnitTypeModel
from app.schemas import UnitTypeCreate, UnitTypeUpdate, UnitTypeResponse
from app.auth import get_current_user

router = APIRouter()

@router.get("", response_model=List[UnitTypeResponse])
def list_unit_types(db: Session = Depends(get_db)):
    """Get all unit types ordered by order_index"""
    unit_types = db.query(UnitTypeModel).order_by(UnitTypeModel.order_index).all()
    return unit_types

@router.post("", response_model=UnitTypeResponse)
def create_unit_type(
    unit_type: UnitTypeCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create a new unit type (admin only)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can create unit types")
    
    # Check if code already exists
    existing = db.query(UnitTypeModel).filter(UnitTypeModel.code == unit_type.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Unit type code already exists")
    
    db_unit_type = UnitTypeModel(
        code=unit_type.code,
        label=unit_type.label,
        order_index=unit_type.order_index,
        is_system=False
    )
    db.add(db_unit_type)
    db.commit()
    db.refresh(db_unit_type)
    return db_unit_type

@router.put("/{unit_type_id}", response_model=UnitTypeResponse)
def update_unit_type(
    unit_type_id: UUID,
    unit_type: UnitTypeUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update a unit type (admin only)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can update unit types")
    
    db_unit_type = db.query(UnitTypeModel).filter(UnitTypeModel.id == unit_type_id).first()
    if not db_unit_type:
        raise HTTPException(status_code=404, detail="Unit type not found")
    
    if db_unit_type.is_system:
        raise HTTPException(status_code=400, detail="Cannot modify system unit types")
    
    if unit_type.label is not None:
        db_unit_type.label = unit_type.label
    if unit_type.order_index is not None:
        db_unit_type.order_index = unit_type.order_index
    
    db.commit()
    db.refresh(db_unit_type)
    return db_unit_type

@router.delete("/{unit_type_id}")
def delete_unit_type(
    unit_type_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Delete a unit type (admin only)"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can delete unit types")
    
    db_unit_type = db.query(UnitTypeModel).filter(UnitTypeModel.id == unit_type_id).first()
    if not db_unit_type:
        raise HTTPException(status_code=404, detail="Unit type not found")
    
    if db_unit_type.is_system:
        raise HTTPException(status_code=400, detail="Cannot delete system unit types")
    
    # Check if any units are using this type
    from app.models import OrgUnit
    units_using_type = db.query(OrgUnit).filter(OrgUnit.unit_type == db_unit_type.code).count()
    if units_using_type > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete unit type: {units_using_type} units are using this type"
        )
    
    db.delete(db_unit_type)
    db.commit()
    return {"message": "Unit type deleted successfully"}
