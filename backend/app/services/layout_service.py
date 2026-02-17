"""
Layout Engine - Fully Deterministic
Children positioned STRICTLY under parent
"""
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Dict, Tuple
from app.models import OrgUnit
from app.services.aggregation_service import get_hierarchy_level

BOX_WIDTH = 180
BOX_HEIGHT = 70
HORIZONTAL_SPACING = 40
VERTICAL_SPACING = 100
START_X = 400
START_Y = 50


def calculate_subtree_width(db: Session, unit: OrgUnit) -> int:
    """Calculate total width needed for unit and all descendants"""
    if not unit.children:
        return BOX_WIDTH
    
    children_width = sum(calculate_subtree_width(db, child) for child in unit.children)
    children_width += HORIZONTAL_SPACING * (len(unit.children) - 1)
    
    return max(BOX_WIDTH, children_width)


def position_unit_and_children(db: Session, unit: OrgUnit, x: int, y: int, layout: List[Dict], edges: List[Dict]):
    """Recursively position unit and children"""
    
    # Position current unit
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
            'parent_unit_id': str(unit.parent_unit_id) if unit.parent_unit_id else None
        }
    })
    
    if not unit.children:
        return
    
    # Calculate positions for children
    children = sorted(unit.children, key=lambda c: c.order_index)
    
    # Calculate total width needed for all children
    total_width = sum(calculate_subtree_width(db, child) for child in children)
    total_width += HORIZONTAL_SPACING * (len(children) - 1)
    
    # Start position for children (centered under parent)
    child_start_x = x + (BOX_WIDTH - total_width) // 2
    child_y = y + BOX_HEIGHT + VERTICAL_SPACING
    
    current_x = child_start_x
    
    for child in children:
        child_width = calculate_subtree_width(db, child)
        child_center_x = current_x + child_width // 2 - BOX_WIDTH // 2
        
        # Add edge from parent to child
        edges.append({
            'from': str(unit.id),
            'to': str(child.id),
            'from_x': x + BOX_WIDTH // 2,
            'from_y': y + BOX_HEIGHT,
            'to_x': child_center_x + BOX_WIDTH // 2,
            'to_y': child_y
        })
        
        # Recursively position child
        position_unit_and_children(db, child, child_center_x, child_y, layout, edges)
        
        current_x += child_width + HORIZONTAL_SPACING


def generate_deterministic_layout(db: Session, version_id: UUID) -> Dict:
    """Generate fully deterministic layout"""
    
    # Find root unit (no parent)
    root = db.query(OrgUnit).filter(
        OrgUnit.version_id == version_id,
        OrgUnit.parent_unit_id == None
    ).first()
    
    if not root:
        return {'version_id': str(version_id), 'layout': [], 'edges': []}
    
    layout = []
    edges = []
    
    # Position root and all descendants
    position_unit_and_children(db, root, START_X, START_Y, layout, edges)
    
    return {
        'version_id': str(version_id),
        'layout': layout,
        'edges': edges
    }


def get_unit_color(unit_type: str, stas_code: str) -> Dict[str, str]:
    """Determine color based on unit_type and code"""
    
    if unit_type == 'director_general':
        return {'bg': '#15803d', 'border': '#14532d'}
    
    if unit_type == 'directie':
        # Different color per directie based on code
        colors_map = {
            '1100': {'bg': '#ec4899', 'border': '#db2777'},  # Economica - pink
            '1200': {'bg': '#eab308', 'border': '#ca8a04'},  # Certificari - yellow
            '2000': {'bg': '#3b82f6', 'border': '#2563eb'},  # Inspectorate - blue
            '3000': {'bg': '#f97316', 'border': '#ea580c'},  # Licentiere - orange
        }
        return colors_map.get(stas_code, {'bg': '#3b82f6', 'border': '#2563eb'})
    
    if unit_type == 'serviciu':
        return {'bg': '#22c55e', 'border': '#16a34a'}
    
    if unit_type == 'compartiment':
        return {'bg': '#ffffff', 'border': '#d1d5db'}
    
    if unit_type == 'inspectorat':
        return {'bg': '#3b82f6', 'border': '#2563eb'}
    
    return {'bg': '#ffffff', 'border': '#d1d5db'}
