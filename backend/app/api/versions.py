from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.database import get_db
from app.models import OrgVersion, User
from app.schemas import OrgVersion as OrgVersionSchema, OrgVersionCreate, OrgVersionUpdate
from app.auth import get_current_user, require_role

router = APIRouter()

@router.get("/", response_model=List[OrgVersionSchema])
def list_versions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(OrgVersion).order_by(OrgVersion.created_date.desc()).all()

@router.get("/{version_id}", response_model=OrgVersionSchema)
def get_version(
    version_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    version = db.query(OrgVersion).filter(OrgVersion.id == version_id).first()
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
    return version

@router.post("/", response_model=OrgVersionSchema)
def create_version(
    version_data: OrgVersionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("editor"))
):
    version = OrgVersion(**version_data.model_dump())
    db.add(version)
    db.commit()
    db.refresh(version)
    return version

@router.put("/{version_id}", response_model=OrgVersionSchema)
def update_version(
    version_id: UUID,
    version_data: OrgVersionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("editor"))
):
    version = db.query(OrgVersion).filter(OrgVersion.id == version_id).first()
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
    
    # Only approvers can approve
    if version_data.status == "approved" and current_user.role not in ["approver", "admin"]:
        raise HTTPException(status_code=403, detail="Only approvers can approve versions")
    
    for key, value in version_data.model_dump(exclude_unset=True).items():
        setattr(version, key, value)
    
    db.commit()
    db.refresh(version)
    return version

@router.delete("/{version_id}")
def delete_version(
    version_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    version = db.query(OrgVersion).filter(OrgVersion.id == version_id).first()
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
    
    # Allow deletion of any version (including approved ones) for admins
    # Frontend will show appropriate warnings
    db.delete(version)
    db.commit()
    return {"message": "Version deleted"}

