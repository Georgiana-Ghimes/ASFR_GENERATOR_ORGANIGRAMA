from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.database import get_db
from app.models import PositionAssignment, User
from app.schemas import PositionAssignment as AssignmentSchema, PositionAssignmentCreate, PositionAssignmentUpdate
from app.auth import get_current_user, require_role

router = APIRouter()

@router.get("", response_model=List[AssignmentSchema])
def list_assignments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(PositionAssignment).all()

@router.get("/{assignment_id}", response_model=AssignmentSchema)
def get_assignment(
    assignment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    assignment = db.query(PositionAssignment).filter(PositionAssignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return assignment

@router.post("", response_model=AssignmentSchema)
def create_assignment(
    assignment_data: PositionAssignmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("editor"))
):
    assignment = PositionAssignment(**assignment_data.model_dump())
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment

@router.put("/{assignment_id}", response_model=AssignmentSchema)
def update_assignment(
    assignment_id: UUID,
    assignment_data: PositionAssignmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("editor"))
):
    assignment = db.query(PositionAssignment).filter(PositionAssignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    for key, value in assignment_data.model_dump(exclude_unset=True).items():
        setattr(assignment, key, value)
    
    db.commit()
    db.refresh(assignment)
    return assignment

@router.delete("/{assignment_id}")
def delete_assignment(
    assignment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("editor"))
):
    assignment = db.query(PositionAssignment).filter(PositionAssignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    db.delete(assignment)
    db.commit()
    return {"message": "Assignment deleted"}
