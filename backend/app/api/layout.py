"""
Layout API - Returns deterministic layout
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from app.database import get_db
from app.services.layout_service import generate_deterministic_layout
from app.services.aggregation_service import calculate_version_aggregates

router = APIRouter()


@router.get("/layout/{version_id}")
def get_layout(version_id: UUID, db: Session = Depends(get_db)):
    """
    Generate deterministic layout with aggregated data
    """
    try:
        # Generate layout
        layout_data = generate_deterministic_layout(db, version_id)
        
        # Calculate aggregates
        aggregates = calculate_version_aggregates(db, version_id)
        
        # Enrich layout with aggregates
        for node in layout_data['layout']:
            unit_id = UUID(node['unit_id'])
            if unit_id in aggregates:
                node['aggregates'] = aggregates[unit_id]
        
        return layout_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
