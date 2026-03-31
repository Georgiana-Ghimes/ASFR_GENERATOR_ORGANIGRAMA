from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.database import get_db
from app.models import OrgVersion, User
from app.schemas import OrgVersion as OrgVersionSchema, OrgVersionCreate, OrgVersionUpdate
from app.auth import get_current_user, require_role

router = APIRouter()

@router.get("", response_model=List[OrgVersionSchema])
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
            "approved_by_name": None,
            "has_units_snapshot": version.units_snapshot is not None and len(version.units_snapshot or '') > 2,
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

@router.post("", response_model=OrgVersionSchema)
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
        # Save JSON snapshot of all units at approval time
        import json
        from app.models import OrgUnit
        units = db.query(OrgUnit).filter(OrgUnit.version_id == version_id).all()
        snapshot = []
        for u in units:
            snapshot.append({
                'id': str(u.id),
                'stas_code': u.stas_code,
                'name': u.name,
                'unit_type': u.unit_type,
                'parent_unit_id': str(u.parent_unit_id) if u.parent_unit_id else None,
                'order_index': u.order_index,
                'leadership_count': u.leadership_count,
                'execution_count': u.execution_count,
                'custom_x': u.custom_x,
                'custom_y': u.custom_y,
                'custom_width': u.custom_width,
                'custom_height': u.custom_height,
                'color': u.color,
                'director_title': u.director_title,
                'director_name': u.director_name,
                'legend_col1': u.legend_col1,
                'legend_col2': u.legend_col2,
                'legend_col3': u.legend_col3,
                'is_rotated': u.is_rotated,
            })
        version.units_snapshot = json.dumps(snapshot)
    
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
    """Clone a version. If source is approved and has a snapshot, clone from snapshot."""
    from app.models import OrgUnit
    from datetime import datetime
    import uuid
    import json
    
    source_version = db.query(OrgVersion).filter(OrgVersion.id == version_id).first()
    if not source_version:
        raise HTTPException(status_code=404, detail="Version not found")
    
    # Generate new version number
    latest_versions = db.query(OrgVersion).order_by(OrgVersion.created_date.desc()).limit(5).all()
    version_numbers = [v.version_number for v in latest_versions if v.version_number]
    try:
        if version_numbers:
            latest_num = max([float(v) for v in version_numbers if v.replace('.', '').isdigit()])
            new_version_num = str(latest_num + 0.1)
        else:
            new_version_num = "1.0"
    except:
        new_version_num = f"{source_version.version_number}.1"
    
    new_version = OrgVersion(
        version_number=new_version_num,
        name=f"Versiune {new_version_num}",
        status="draft",
        notes=f"Clonată din versiunea {source_version.name}",
        chart_title=source_version.chart_title,
        org_type=source_version.org_type
    )
    db.add(new_version)
    db.flush()
    
    # If source is approved and has a snapshot, clone from snapshot (approved state)
    if source_version.status == "approved" and source_version.units_snapshot:
        snapshot = json.loads(source_version.units_snapshot)
        old_to_new = {}
        
        for unit_data in snapshot:
            new_unit = OrgUnit(
                id=uuid.uuid4(),
                version_id=new_version.id,
                stas_code=unit_data['stas_code'],
                name=unit_data['name'],
                unit_type=unit_data['unit_type'],
                order_index=unit_data.get('order_index', 0),
                leadership_count=unit_data.get('leadership_count', 0),
                execution_count=unit_data.get('execution_count', 0),
                custom_x=unit_data.get('custom_x'),
                custom_y=unit_data.get('custom_y'),
                custom_width=unit_data.get('custom_width'),
                custom_height=unit_data.get('custom_height'),
                color=unit_data.get('color'),
                director_title=unit_data.get('director_title'),
                director_name=unit_data.get('director_name'),
                legend_col1=unit_data.get('legend_col1'),
                legend_col2=unit_data.get('legend_col2'),
                legend_col3=unit_data.get('legend_col3'),
                is_rotated=unit_data.get('is_rotated', False),
                parent_unit_id=None,
            )
            db.add(new_unit)
            db.flush()
            old_to_new[unit_data['id']] = new_unit.id
        
        for unit_data in snapshot:
            if unit_data.get('parent_unit_id'):
                new_id = old_to_new.get(unit_data['id'])
                new_parent = old_to_new.get(unit_data['parent_unit_id'])
                if new_id and new_parent:
                    u = db.query(OrgUnit).filter(OrgUnit.id == new_id).first()
                    if u:
                        u.parent_unit_id = new_parent
    else:
        # Clone from current units
        source_units = db.query(OrgUnit).filter(OrgUnit.version_id == version_id).all()
        unit_id_map = {}
        
        for source_unit in source_units:
            new_unit = OrgUnit(
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
                parent_unit_id=None,
            )
            db.add(new_unit)
            db.flush()
            unit_id_map[source_unit.id] = new_unit.id
        
        for source_unit in source_units:
            if source_unit.parent_unit_id:
                new_unit_id = unit_id_map[source_unit.id]
                new_parent_id = unit_id_map.get(source_unit.parent_unit_id)
                if new_parent_id:
                    u = db.query(OrgUnit).filter(OrgUnit.id == new_unit_id).first()
                    u.parent_unit_id = new_parent_id
    
    db.commit()
    db.refresh(new_version)
    return new_version

@router.post("/{version_id}/restore", response_model=OrgVersionSchema)
def restore_version(
    version_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    """Restore an approved version back to draft, recreating units from the approval snapshot"""
    from app.models import OrgUnit
    import json
    import uuid as uuid_mod
    
    version = db.query(OrgVersion).filter(OrgVersion.id == version_id).first()
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
    
    if version.status != "approved":
        raise HTTPException(status_code=400, detail="Only approved versions can be restored")
    
    if not version.units_snapshot:
        raise HTTPException(status_code=400, detail="No snapshot available for this version")
    
    # Parse the snapshot
    snapshot = json.loads(version.units_snapshot)
    
    # Delete all current units for this version
    db.query(OrgUnit).filter(OrgUnit.version_id == version_id).delete()
    db.flush()
    
    # Recreate units from snapshot
    old_to_new_id = {}
    
    # First pass: create all units without parent
    for unit_data in snapshot:
        old_id = unit_data['id']
        new_unit = OrgUnit(
            id=uuid_mod.uuid4(),
            version_id=version_id,
            stas_code=unit_data['stas_code'],
            name=unit_data['name'],
            unit_type=unit_data['unit_type'],
            order_index=unit_data.get('order_index', 0),
            leadership_count=unit_data.get('leadership_count', 0),
            execution_count=unit_data.get('execution_count', 0),
            custom_x=unit_data.get('custom_x'),
            custom_y=unit_data.get('custom_y'),
            custom_width=unit_data.get('custom_width'),
            custom_height=unit_data.get('custom_height'),
            color=unit_data.get('color'),
            director_title=unit_data.get('director_title'),
            director_name=unit_data.get('director_name'),
            legend_col1=unit_data.get('legend_col1'),
            legend_col2=unit_data.get('legend_col2'),
            legend_col3=unit_data.get('legend_col3'),
            is_rotated=unit_data.get('is_rotated', False),
            parent_unit_id=None,
        )
        db.add(new_unit)
        db.flush()
        old_to_new_id[old_id] = new_unit.id
    
    # Second pass: set parent relationships
    for unit_data in snapshot:
        if unit_data.get('parent_unit_id'):
            new_id = old_to_new_id.get(unit_data['id'])
            new_parent_id = old_to_new_id.get(unit_data['parent_unit_id'])
            if new_id and new_parent_id:
                unit = db.query(OrgUnit).filter(OrgUnit.id == new_id).first()
                if unit:
                    unit.parent_unit_id = new_parent_id
    
    # Change status back to draft
    version.status = "draft"
    version.approved_by = None
    version.approved_at = None
    
    db.commit()
    db.refresh(version)
    return version

@router.post("/{version_id}/snapshot")
def save_snapshot(
    version_id: UUID,
    snapshot_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Save a snapshot image for a version"""
    version = db.query(OrgVersion).filter(OrgVersion.id == version_id).first()
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
    
    # Store base64 encoded image
    version.snapshot_image = snapshot_data.get('image')
    
    db.commit()
    return {"message": "Snapshot saved successfully"}

@router.get("/{version_id}/snapshot")
def get_snapshot(
    version_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get snapshot image for a version"""
    version = db.query(OrgVersion).filter(OrgVersion.id == version_id).first()
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
    
    return {"image": version.snapshot_image}
