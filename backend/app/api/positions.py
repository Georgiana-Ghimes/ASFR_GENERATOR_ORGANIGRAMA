from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from app.database import get_db
from app.models import Position, OrgVersion, User
from app.schemas import Position as PositionSchema, PositionCreate, PositionUpdate
from app.auth import get_current_user, require_role

router = APIRouter()

@router.get("/", response_model=List[PositionSchema])
def list_positions(
    version_id: Optional[UUID] = Query(None),
    unit_id: Optional[UUID] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Position)
    if version_id:
        query = query.filter(Position.version_id == version_id)
    if unit_id:
        query = query.filter(Position.unit_id == unit_id)
    return query.order_by(Position.order_index).all()

@router.get("/{position_id}", response_model=PositionSchema)
def get_position(
    position_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    position = db.query(Position).filter(Position.id == position_id).first()
    if not position:
        raise HTTPException(status_code=404, detail="Position not found")
    return position

@router.post("/", response_model=PositionSchema)
def create_position(
    position_data: PositionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("editor"))
):
    version = db.query(OrgVersion).filter(OrgVersion.id == position_data.version_id).first()
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
    if version.status != "draft":
        raise HTTPException(status_code=400, detail="Cannot modify non-draft version")
    
    position = Position(**position_data.model_dump())
    db.add(position)
    db.commit()
    db.refresh(position)
    return position

@router.put("/{position_id}", response_model=PositionSchema)
def update_position(
    position_id: UUID,
    position_data: PositionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("editor"))
):
    position = db.query(Position).filter(Position.id == position_id).first()
    if not position:
        raise HTTPException(status_code=404, detail="Position not found")
    
    version = db.query(OrgVersion).filter(OrgVersion.id == position.version_id).first()
    if version.status != "draft":
        raise HTTPException(status_code=400, detail="Cannot modify non-draft version")
    
    for key, value in position_data.model_dump(exclude_unset=True).items():
        setattr(position, key, value)
    
    db.commit()
    db.refresh(position)
    return position

@router.delete("/{position_id}")
def delete_position(
    position_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("editor"))
):
    position = db.query(Position).filter(Position.id == position_id).first()
    if not position:
        raise HTTPException(status_code=404, detail="Position not found")
    
    version = db.query(OrgVersion).filter(OrgVersion.id == position.version_id).first()
    if version.status != "draft":
        raise HTTPException(status_code=400, detail="Cannot delete from non-draft version")
    
    db.delete(position)
    db.commit()
    return {"message": "Position deleted"}
