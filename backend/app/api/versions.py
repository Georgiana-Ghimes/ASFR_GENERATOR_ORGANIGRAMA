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
    versions = db.query(OrgVersion).order_by(OrgVersion.created_date.desc()).all()
    
    # Add approved_by_name for each version
    result = []
    for version in versions:
        version_dict = {
            "id": version.id,
            "version_number": version.version_number,
            "name": version.name,
            "status": version.status,
            "notes": version.notes,
            "chart_title": version.chart_title,
            "org_type": version.org_type,
            "created_date": version.created_date,
            "valid_from": version.valid_from,
            "valid_until": version.valid_until,
            "approved_by": version.approved_by,
            "approved_at": version.approved_at,
            "approved_by_name": None
        }
        
        if version.approved_by:
            approver = db.query(User).filter(User.id == version.approved_by).first()
            if approver:
                version_dict["approved_by_name"] = approver.full_name or approver.email
        
        result.append(OrgVersionSchema(**version_dict))
    
    return result

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
    from datetime import datetime
    
    version = db.query(OrgVersion).filter(OrgVersion.id == version_id).first()
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
    
    # Only approvers can approve
    if version_data.status == "approved" and current_user.role not in ["approver", "admin"]:
        raise HTTPException(status_code=403, detail="Only approvers can approve versions")
    
    # Track if status is changing to approved
    is_being_approved = version_data.status == "approved" and version.status != "approved"
    
    # Track if status is changing from approved to something else (unapprove)
    is_being_unapproved = version.status == "approved" and version_data.status != "approved"
    
    for key, value in version_data.model_dump(exclude_unset=True).items():
        if key not in ['approved_by', 'approved_at']:  # Don't set these directly from request
            setattr(version, key, value)
    
    # Set approval tracking when version is approved
    if is_being_approved:
        version.approved_by = current_user.id
        version.approved_at = datetime.utcnow()
    
    # Clear approval tracking when version is unapproved
    if is_being_unapproved:
        version.approved_by = None
        version.approved_at = None
    
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

@router.patch("/{version_id}/chart-title")
def update_chart_title(
    version_id: UUID,
    title: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("editor"))
):
    version = db.query(OrgVersion).filter(OrgVersion.id == version_id).first()
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
    
    version.chart_title = title
    db.commit()
    db.refresh(version)
    return {"chart_title": version.chart_title}

@router.patch("/{version_id}/validity")
def update_validity_dates(
    version_id: UUID,
    valid_from: str = None,
    valid_until: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("editor"))
):
    from datetime import datetime as dt
    
    version = db.query(OrgVersion).filter(OrgVersion.id == version_id).first()
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
    
    if valid_from:
        version.valid_from = dt.strptime(valid_from, '%Y-%m-%d').date()
    if valid_until:
        version.valid_until = dt.strptime(valid_until, '%Y-%m-%d').date()
    
    db.commit()
    db.refresh(version)
    return {"valid_from": version.valid_from, "valid_until": version.valid_until}

@router.post("/{version_id}/clone", response_model=OrgVersionSchema)
def clone_version(
    version_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("editor"))
):
    """Clone a version with all its units and relationships"""
    from app.models import OrganizationalUnit
    from datetime import datetime
    
    # Get source version
    source_version = db.query(OrgVersion).filter(OrgVersion.id == version_id).first()
    if not source_version:
        raise HTTPException(status_code=404, detail="Version not found")
    
    # Create new version
    new_version = OrgVersion(
        version_number=f"{source_version.version_number}.1",
        name=f"{source_version.name} (Copie)",
        status="draft",
        notes=source_version.notes,
        chart_title=source_version.chart_title,
        org_type=source_version.org_type
    )
    db.add(new_version)
    db.flush()  # Get the new version ID
    
    # Get all units from source version
    source_units = db.query(OrganizationalUnit).filter(
        OrganizationalUnit.version_id == version_id
    ).all()
    
    # Map old unit IDs to new unit IDs
    unit_id_map = {}
    
    # First pass: create all units without parent relationships
    for source_unit in source_units:
        new_unit = OrganizationalUnit(
            version_id=new_version.id,
            stas_code=source_unit.stas_code,
            name=source_unit.name,
            unit_type=source_unit.unit_type,
            order_index=source_unit.order_index,
            leadership_count=source_unit.leadership_count,
            execution_count=source_unit.execution_count,
            custom_x=source_unit.custom_x,
            custom_y=source_unit.custom_y,
            custom_width=source_unit.custom_width,
            custom_height=source_unit.custom_height,
            color=source_unit.color,
            director_title=source_unit.director_title,
            director_name=source_unit.director_name,
            legend_col1=source_unit.legend_col1,
            legend_col2=source_unit.legend_col2,
            legend_col3=source_unit.legend_col3,
            is_rotated=source_unit.is_rotated,
            parent_unit_id=None  # Will be set in second pass
        )
        db.add(new_unit)
        db.flush()  # Get the new unit ID
        unit_id_map[source_unit.id] = new_unit.id
    
    # Second pass: update parent relationships
    for source_unit in source_units:
        if source_unit.parent_unit_id:
            new_unit_id = unit_id_map[source_unit.id]
            new_parent_id = unit_id_map.get(source_unit.parent_unit_id)
            if new_parent_id:
                new_unit = db.query(OrganizationalUnit).filter(
                    OrganizationalUnit.id == new_unit_id
                ).first()
                new_unit.parent_unit_id = new_parent_id
    
    db.commit()
    db.refresh(new_version)
    return new_version
