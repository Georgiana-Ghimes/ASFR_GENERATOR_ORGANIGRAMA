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

BOX_WIDTH = 320
BOX_HEIGHT = 45  # Minimum height for single line text
HORIZONTAL_SPACING = 40
VERTICAL_SPACING = 100

# Fixed positions for header elements
CONSILIU_Y = 40  # Consiliul de Conducere position (aligned to 20px grid: 2 cells)
CONSILIU_HEIGHT = 40
DG_Y = CONSILIU_Y + CONSILIU_HEIGHT + 40  # Director General position
START_Y = DG_Y + BOX_HEIGHT + VERTICAL_SPACING  # Where children of DG start


def calculate_box_height(unit_name: str) -> int:
    """Calculate dynamic box height based on text length, aligned to 20px grid"""
    # MAXIMUM HEIGHT: 60px (3 grid cells)
    # For longer text, we reduce font size instead of increasing height
    # Use character count ranges calibrated for 10px font with word wrapping
    
    text_length = len(unit_name)
    
    # Character ranges calibrated to actual browser rendering
    # Maximum height is 60px (3 grid cells)
    if text_length <= 35:
        # Short names: 1 line
        return 40  # 2 grid cells
    elif text_length <= 50:
        # Medium names: 2 lines
        return 40  # 2 grid cells
    else:
        # Longer names: 3 lines (MAXIMUM)
        # Font will be reduced for very long text to fit in 3 lines
        return 60  # 3 grid cells (MAXIMUM)


def calculate_subtree_width(db: Session, unit: OrgUnit, visited: set = None) -> int:
    """Calculate total width needed for unit and all descendants"""
    if visited is None:
        visited = set()
    
    if unit.id in visited:
        return BOX_WIDTH  # Break circular reference
    visited.add(unit.id)
    
    if not unit.children:
        return BOX_WIDTH
    
    children_width = sum(calculate_subtree_width(db, child, visited) for child in unit.children)
    children_width += HORIZONTAL_SPACING * (len(unit.children) - 1)
    
    return max(BOX_WIDTH, children_width)


def position_unit_and_children(db: Session, unit: OrgUnit, x: int, y: int, layout: List[Dict], edges: List[Dict], parent_x: int = None, parent_y: int = None, parent_height: int = None, is_root: bool = False, visited: set = None):
    """Recursively position unit and children - use custom positions if available"""
    if visited is None:
        visited = set()
    
    if unit.id in visited:
        return  # Break circular reference
    visited.add(unit.id)
    
    # Use custom position if available, otherwise use calculated position
    actual_x = unit.custom_x if unit.custom_x is not None else x
    actual_y = unit.custom_y if unit.custom_y is not None else y
    
    # Calculate dynamic height based on name length, or use custom height if set
    if unit.custom_height is not None:
        box_height = unit.custom_height
    else:
        box_height = calculate_box_height(unit.name)
    
    # Director General always has width of 300px (same as Consiliu), or use custom width
    if unit.custom_width is not None:
        box_width = unit.custom_width
    elif unit.unit_type == 'director_general':
        box_width = 300
    else:
        box_width = BOX_WIDTH
    
    # Position current unit
    layout.append({
        'unit_id': str(unit.id),
        'x': actual_x,
        'y': actual_y,
        'width': box_width,
        'height': box_height,
        'unit': {
            'id': str(unit.id),
            'stas_code': unit.stas_code,
            'name': unit.name,
            'unit_type': unit.unit_type,
            'parent_unit_id': str(unit.parent_unit_id) if unit.parent_unit_id else None,
            'color': unit.color,
            'leadership_count': unit.leadership_count,
            'execution_count': unit.execution_count,
            'custom_x': unit.custom_x,
            'custom_y': unit.custom_y,
            'custom_height': unit.custom_height,
            'custom_width': unit.custom_width,
            'is_rotated': unit.is_rotated if hasattr(unit, 'is_rotated') else False
        }
    })
    
    # Add edge from parent if exists (but NOT for root - consiliu edge is added separately)
    if not is_root and parent_x is not None and parent_y is not None and parent_height is not None:
        edges.append({
            'from': str(unit.parent_unit_id) if unit.parent_unit_id else 'consiliu',
            'to': str(unit.id),
            'from_x': parent_x + box_width // 2,
            'from_y': parent_y + parent_height,
            'to_x': actual_x + box_width // 2,
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
    child_start_x = actual_x + (box_width - total_width) // 2
    child_y = actual_y + box_height + VERTICAL_SPACING
    
    current_x = child_start_x
    
    for child in children:
        child_width = calculate_subtree_width(db, child)
        child_center_x = current_x + child_width // 2 - BOX_WIDTH // 2
        
        # Recursively position child
        position_unit_and_children(db, child, child_center_x, child_y, layout, edges, actual_x, actual_y, box_height, False, visited)
        
        current_x += child_width + HORIZONTAL_SPACING


def generate_deterministic_layout(db: Session, version_id: UUID) -> Dict:
    """Generate fully deterministic layout with DG under Consiliu"""
    
    # Find root unit (Director General - no parent and type director_general)
    root = db.query(OrgUnit).filter(
        OrgUnit.version_id == version_id,
        OrgUnit.unit_type == 'director_general'
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
    consiliu_width = 300  # 15 grid cells (300px)
    dg_width = 300  # DG has same width as Consiliu
    
    # Calculate consiliu position snapped to grid
    consiliu_x_raw = (canvas_width - consiliu_width) // 2
    consiliu_x = (consiliu_x_raw // 20) * 20  # Snap to nearest grid line
    consiliu_center_x = consiliu_x + consiliu_width // 2  # Actual center of consiliu box
    
    # Center the Director General horizontally (same width as Consiliu)
    # Calculate position and snap to grid (20px) to align with grid lines
    dg_x_raw = consiliu_center_x - dg_width // 2
    dg_x = (dg_x_raw // 20) * 20  # Snap to nearest grid line
    dg_center_x = dg_x + dg_width // 2  # Actual center of DG box
    
    # Add edge from Consiliu to DG - line starts from CENTER of consiliu box
    edges.append({
        'from': 'consiliu',
        'to': str(root.id),
        'from_x': consiliu_center_x,  # CENTER of consiliu (actual center after snap)
        'from_y': CONSILIU_Y + CONSILIU_HEIGHT,  # Bottom of consiliu box
        'to_x': dg_center_x,  # CENTER of DG box (actual center after snap)
        'to_y': DG_Y
    })
    
    # Position DG and all descendants (mark as root to skip duplicate edge)
    position_unit_and_children(db, root, dg_x, DG_Y, layout, edges, consiliu_x, CONSILIU_Y, CONSILIU_HEIGHT, is_root=True)
    
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
