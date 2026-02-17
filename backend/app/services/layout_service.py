"""
Layout Engine - Fully Deterministic
Generates layout coordinates from hierarchy structure only
NO manual positioning, NO saved coordinates
"""
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Dict
from app.models import OrgUnit
from app.services.aggregation_service import get_hierarchy_level

# Layout constants
BOX_WIDTH = 200
BOX_HEIGHT = 80
HORIZONTAL_SPACING = 50
VERTICAL_SPACING = 120
START_X = 100
START_Y = 100


def generate_deterministic_layout(db: Session, version_id: UUID) -> Dict:
    """
    Generate fully deterministic layout from hierarchy
    Returns: {
        version_id,
        layout: [{unit_id, x, y, width, height, unit_data}]
    }
    """
    units = db.query(OrgUnit).filter(OrgUnit.version_id == version_id).order_by(OrgUnit.order_index).all()
    
    if not units:
        return {'version_id': str(version_id), 'layout': []}
    
    # Group by hierarchy level
    levels: Dict[int, List[OrgUnit]] = {}
    for unit in units:
        level = get_hierarchy_level(db, unit.id)
        if level not in levels:
            levels[level] = []
        levels[level].append(unit)
    
    # Calculate positions
    layout = []
    
    for level_num in sorted(levels.keys()):
        level_units = levels[level_num]
        y = START_Y + (level_num * (BOX_HEIGHT + VERTICAL_SPACING))
        
        # Calculate total width needed for this level
        total_width = len(level_units) * BOX_WIDTH + (len(level_units) - 1) * HORIZONTAL_SPACING
        
        # Center the level horizontally
        start_x = START_X
        
        for i, unit in enumerate(level_units):
            x = start_x + (i * (BOX_WIDTH + HORIZONTAL_SPACING))
            
            layout.append({
                'unit_id': str(unit.id),
                'x': x,
                'y': y,
                'width': BOX_WIDTH,
                'height': BOX_HEIGHT,
                'unit': {
                    'id': str(unit.id),
                    'stas_code': unit.stas_code,
                    'name': unit.name,
                    'unit_type': unit.unit_type.value,
                    'parent_unit_id': str(unit.parent_unit_id) if unit.parent_unit_id else None,
                    'hierarchy_level': level_num
                }
            })
    
    return {
        'version_id': str(version_id),
        'layout': layout
    }


def get_unit_color(unit_type: str) -> Dict[str, str]:
    """
    Determine color based on unit_type (deterministic)
    """
    colors = {
        'director_general': {'bg': '#16a34a', 'border': '#15803d'},  # dark green
        'directie': {'bg': '#3b82f6', 'border': '#2563eb'},  # blue
        'serviciu': {'bg': '#22c55e', 'border': '#16a34a'},  # light green
        'compartiment': {'bg': '#ffffff', 'border': '#d1d5db'},  # white
        'inspectorat': {'bg': '#3b82f6', 'border': '#2563eb'},  # blue
        'birou': {'bg': '#a855f7', 'border': '#9333ea'}  # purple
    }
    return colors.get(unit_type, colors['compartiment'])
