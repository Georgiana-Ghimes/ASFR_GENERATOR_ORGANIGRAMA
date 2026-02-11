from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from app.database import get_db
from app.models import OrgUnit, OrgVersion, User
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
    
    unit = OrgUnit(**unit_data.model_dump())
    db.add(unit)
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
    
    for key, value in unit_data.model_dump(exclude_unset=True).items():
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
    
    db.delete(unit)
    db.commit()
    return {"message": "Unit deleted"}
