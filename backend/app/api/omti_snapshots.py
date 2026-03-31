from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel
from datetime import datetime
from app.database import get_db
from app.models import OmtiSnapshot, OrgVersion, User
from app.auth import get_current_user

router = APIRouter()


class OmtiSnapshotCreate(BaseModel):
    version_id: UUID
    image: str


class OmtiSnapshotResponse(BaseModel):
    id: UUID
    version_id: UUID
    version_name: Optional[str] = None
    image: str
    created_at: datetime

    class Config:
        from_attributes = True


@router.get("", response_model=List[OmtiSnapshotResponse])
def list_omti_snapshots(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    snapshots = (
        db.query(OmtiSnapshot)
        .order_by(OmtiSnapshot.created_at.desc())
        .all()
    )
    result = []
    for s in snapshots:
        version = db.query(OrgVersion).filter(OrgVersion.id == s.version_id).first()
        result.append(OmtiSnapshotResponse(
            id=s.id,
            version_id=s.version_id,
            version_name=version.name if version else None,
            image=s.image,
            created_at=s.created_at,
        ))
    return result


@router.post("", response_model=OmtiSnapshotResponse)
def create_omti_snapshot(
    data: OmtiSnapshotCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    snapshot = OmtiSnapshot(
        version_id=data.version_id,
        image=data.image,
    )
    db.add(snapshot)
    db.commit()
    db.refresh(snapshot)

    version = db.query(OrgVersion).filter(OrgVersion.id == snapshot.version_id).first()
    return OmtiSnapshotResponse(
        id=snapshot.id,
        version_id=snapshot.version_id,
        version_name=version.name if version else None,
        image=snapshot.image,
        created_at=snapshot.created_at,
    )


@router.get("/{snapshot_id}")
def get_omti_snapshot(
    snapshot_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    snapshot = db.query(OmtiSnapshot).filter(OmtiSnapshot.id == snapshot_id).first()
    if not snapshot:
        raise HTTPException(status_code=404, detail="Snapshot not found")
    return {"id": str(snapshot.id), "image": snapshot.image}


@router.delete("/{snapshot_id}")
def delete_omti_snapshot(
    snapshot_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    snapshot = db.query(OmtiSnapshot).filter(OmtiSnapshot.id == snapshot_id).first()
    if not snapshot:
        raise HTTPException(status_code=404, detail="Snapshot not found")
    db.delete(snapshot)
    db.commit()
    return {"message": "Snapshot deleted"}
