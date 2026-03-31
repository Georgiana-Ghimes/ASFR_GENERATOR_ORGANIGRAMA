"""
Aggregation Engine
Calculates all totals dynamically from positions and hierarchy
"""
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Dict
from app.models import OrgUnit, Position


def calculate_unit_aggregates(db: Session, unit_id: UUID, visited: set = None) -> Dict:
    """
    Calculate aggregates for a single unit
    """
    if visited is None:
        visited = set()
    
    if unit_id in visited:
        return {
            'leadership_positions_count': 0,
            'execution_positions_count': 0,
            'total_positions': 0,
            'recursive_total_subordinates': 0
        }
    visited.add(unit_id)
    
    unit = db.query(OrgUnit).filter(OrgUnit.id == unit_id).first()
    if not unit:
        return {
            'leadership_positions_count': 0,
            'execution_positions_count': 0,
            'total_positions': 0,
            'recursive_total_subordinates': 0
        }
    
    # Count direct positions from unit fields
    leadership_count = unit.leadership_count or 0
    execution_count = unit.execution_count or 0
    direct_total = leadership_count + execution_count
    
    # Calculate recursive total
    recursive_total = direct_total
    for child in unit.children:
        child_agg = calculate_unit_aggregates(db, child.id, visited)
        recursive_total += child_agg['recursive_total_subordinates']
    
    return {
        'leadership_positions_count': leadership_count,
        'execution_positions_count': execution_count,
        'total_positions': direct_total,
        'recursive_total_subordinates': recursive_total
    }


def calculate_version_aggregates(db: Session, version_id: UUID) -> Dict[UUID, Dict]:
    """
    Calculate aggregates for all units in a version
    Returns: {unit_id: aggregates_dict}
    """
    units = db.query(OrgUnit).filter(OrgUnit.version_id == version_id).all()
    
    result = {}
    for unit in units:
        result[unit.id] = calculate_unit_aggregates(db, unit.id)
    
    return result


def get_hierarchy_level(db: Session, unit_id: UUID) -> int:
    """
    Calculate hierarchy level (0 = root, 1 = direct child, etc.)
    """
    unit = db.query(OrgUnit).filter(OrgUnit.id == unit_id).first()
    if not unit or not unit.parent_unit_id:
        return 0
    
    return 1 + get_hierarchy_level(db, unit.parent_unit_id)
