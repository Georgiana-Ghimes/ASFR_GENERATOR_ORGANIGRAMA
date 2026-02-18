"""
Layout Engine - Fully Deterministic
Director General always positioned under Consiliul de Conducere
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

# Fixed positions for header elements
CONSILIU_Y = 35  # Consiliul de Conducere position (space for header text)
CONSILIU_HEIGHT = 40
DG_Y = CONSILIU_Y + CONSILIU_HEIGHT + 40  # Director General position
START_Y = DG_Y + BOX_HEIGHT + VERTICAL_SPACING  # Where children of DG start


def calculate_subtree_width(db: Session, unit: OrgUnit) -> int:
    """Calculate total width needed for unit and all descendants"""
    if not unit.children:
        return BOX_WIDTH
    
    children_width = sum(calculate_subtree_width(db, child) for child in unit.children)
    children_width += HORIZONTAL_SPACING * (len(unit.children) - 1)
    
    return max(BOX_WIDTH, children_width)


def position_unit_and_children(db: Session, unit: OrgUnit, x: int, y: int, layout: List[Dict], edges: List[Dict], parent_x: int = None, parent_y: int = None, is_root: bool = False):
    """Recursively position unit and children - use custom positions if available"""
    
    # Use custom position if available, otherwise use calculated position
    actual_x = unit.custom_x if unit.custom_x is not None else x
    actual_y = unit.custom_y if unit.custom_y is not None else y
    
    # Position current unit
    layout.append({
        'unit_id': str(unit.id),
        'x': actual_x,
        'y': actual_y,
        'width': BOX_WIDTH,
        'height': BOX_HEIGHT,
        'unit': {
            'id': str(unit.id),
            'stas_code': unit.stas_code,
            'name': unit.name,
            'unit_type': unit.unit_type.value,
            'parent_unit_id': str(unit.parent_unit_id) if unit.parent_unit_id else None,
            'color': unit.color,
            'leadership_count': unit.leadership_count,
            'execution_count': unit.execution_count,
            'custom_x': unit.custom_x,
            'custom_y': unit.custom_y
        }
    })
    
    # Add edge from parent if exists (but NOT for root - consiliu edge is added separately)
    if not is_root and parent_x is not None and parent_y is not None:
        edges.append({
            'from': str(unit.parent_unit_id) if unit.parent_unit_id else 'consiliu',
            'to': str(unit.id),
            'from_x': parent_x + BOX_WIDTH // 2,
            'from_y': parent_y + BOX_HEIGHT,
            'to_x': actual_x + BOX_WIDTH // 2,
            'to_y': actual_y
        })
    
    if not unit.children:
        return
    
    # Calculate positions for children
    children = sorted(unit.children, key=lambda c: c.order_index)
    
    # Calculate total width needed for all children
    total_width = sum(calculate_subtree_width(db, child) for child in children)
    total_width += HORIZONTAL_SPACING * (len(children) - 1)
    
    # Start position for children (centered under parent)
    child_start_x = actual_x + (BOX_WIDTH - total_width) // 2
    child_y = actual_y + BOX_HEIGHT + VERTICAL_SPACING
    
    current_x = child_start_x
    
    for child in children:
        child_width = calculate_subtree_width(db, child)
        child_center_x = current_x + child_width // 2 - BOX_WIDTH // 2
        
        # Recursively position child
        position_unit_and_children(db, child, child_center_x, child_y, layout, edges, actual_x, actual_y, False)
        
        current_x += child_width + HORIZONTAL_SPACING


def generate_deterministic_layout(db: Session, version_id: UUID) -> Dict:
    """Generate fully deterministic layout with DG under Consiliu"""
    
    # Find root unit (Director General - no parent)
    root = db.query(OrgUnit).filter(
        OrgUnit.version_id == version_id,
        OrgUnit.parent_unit_id == None
    ).first()
    
    if not root:
        return {'version_id': str(version_id), 'layout': [], 'edges': [], 'canvas_width': 1400}
    
    layout = []
    edges = []
    
    # Calculate total width needed for entire tree
    total_width = calculate_subtree_width(db, root)
    
    # Canvas width is at least 1400px
    canvas_width = max(1400, total_width + 200)
    
    # Consiliu and DG are centered in canvas
    consiliu_center_x = canvas_width // 2
    consiliu_width = 300
    
    # Center the Director General horizontally
    dg_x = consiliu_center_x - BOX_WIDTH // 2
    
    # Add edge from Consiliu to DG - line starts from CENTER of consiliu box
    edges.append({
        'from': 'consiliu',
        'to': str(root.id),
        'from_x': consiliu_center_x,  # CENTER of consiliu
        'from_y': CONSILIU_Y + CONSILIU_HEIGHT,  # Bottom of consiliu box
        'to_x': consiliu_center_x,  # CENTER of DG box (aligned vertically)
        'to_y': DG_Y
    })
    
    # Position DG and all descendants (mark as root to skip duplicate edge)
    position_unit_and_children(db, root, dg_x, DG_Y, layout, edges, consiliu_center_x - consiliu_width // 2, CONSILIU_Y, is_root=True)
    
    return {
        'version_id': str(version_id),
        'layout': layout,
        'edges': edges,
        'canvas_width': canvas_width
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
