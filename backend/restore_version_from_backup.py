#!/usr/bin/env python3
"""Restore the deleted version with all units"""

from app.database import SessionLocal
from app.models import OrgVersion, OrgUnit
from datetime import datetime
import uuid

# Unit data from backup
units_data = [
    {'stas_code': '330', 'name': 'CONSILIU DE CONDUCERE', 'unit_type': 'consiliu', 'parent': None, 'leadership': 0, 'execution': 0, 'order': 0},
    {'stas_code': 'LEGEND', 'name': 'Legendă', 'unit_type': 'legend', 'parent': None, 'leadership': 0, 'execution': 0, 'order': 0},
    {'stas_code': '1000', 'name': 'DIRECTOR GENERAL', 'unit_type': 'director_general', 'parent': None, 'leadership': 1, 'execution': 0, 'order': 1},
    {'stas_code': '1001', 'name': 'SERVICIUL RESURSE UMANE', 'unit_type': 'serviciu', 'parent': '1000', 'leadership': 1, 'execution': 0, 'order': 2, 'color': '#86C67C'},
    {'stas_code': '1002', 'name': 'SERVICIUL JURIDIC', 'unit_type': 'serviciu', 'parent': '1000', 'leadership': 0, 'execution': 3, 'order': 3, 'color': '#86C67C'},
    {'stas_code': '1010', 'name': 'COMPARTIMENT AUDIT INTERN', 'unit_type': 'compartiment', 'parent': '1000', 'leadership': 0, 'execution': 2, 'order': 4, 'color': '#86C67C'},
    {'stas_code': '1011', 'name': 'COMPARTIMENT REGISTRATURA, ARHIVA', 'unit_type': 'compartiment', 'parent': '1010', 'leadership': 0, 'execution': 2, 'order': 5, 'color': '#86C67C'},
    {'stas_code': '1012', 'name': 'COMPARTIMENT SIM, SU', 'unit_type': 'compartiment', 'parent': '1010', 'leadership': 0, 'execution': 2, 'order': 6, 'color': '#86C67C'},
    {'stas_code': '1020', 'name': 'DISPECERAT 112', 'unit_type': 'compartiment', 'parent': '1000', 'leadership': 1, 'execution': 18, 'order': 7, 'color': '#86C67C'},
    {'stas_code': '1021', 'name': 'COMPARTIMENT SOLUȚIONARE DE SIGURANȚĂ CIBERNETICĂ', 'unit_type': 'compartiment', 'parent': '1020', 'leadership': 0, 'execution': 2, 'order': 8, 'color': '#86C67C'},
    {'stas_code': '1022', 'name': 'COMPARTIMENT DREPTUL CALITĂȚII', 'unit_type': 'compartiment', 'parent': '1020', 'leadership': 0, 'execution': 2, 'order': 9, 'color': '#86C67C'},
    {'stas_code': '1030', 'name': 'SERVICIUL COMUNICARE', 'unit_type': 'serviciu', 'parent': '1000', 'leadership': 1, 'execution': 3, 'order': 10, 'color': '#86C67C'},
    {'stas_code': '1031', 'name': 'SERVICIUL CONTROL SI SIGURANȚA CIRCULAȚIEI', 'unit_type': 'serviciu', 'parent': '1030', 'leadership': 0, 'execution': 2, 'order': 11, 'color': '#86C67C'},
    {'stas_code': '1040', 'name': 'COMPARTIMENT CERTIFICARE OMF', 'unit_type': 'compartiment', 'parent': '1000', 'leadership': 1, 'execution': 11, 'order': 12, 'color': '#86C67C'},
    {'stas_code': '1051', 'name': 'COMPARTIMENT CONSILIERI OFICIALI RECUNOȘTERE UNITĂȚI DE INTERVENȚIE', 'unit_type': 'compartiment', 'parent': '1040', 'leadership': 0, 'execution': 2, 'order': 13, 'color': '#86C67C'},
    {'stas_code': '1052', 'name': 'COMPARTIMENT AUTORIZĂRI DE SIGURANȚĂ LA FLACARĂȘI PREVENIRE', 'unit_type': 'compartiment', 'parent': '1040', 'leadership': 0, 'execution': 2, 'order': 14, 'color': '#86C67C'},
    {'stas_code': '1100', 'name': 'DIRECȚIA ECONOMICĂ', 'unit_type': 'directie', 'parent': None, 'leadership': 1, 'execution': 0, 'order': 15, 'color': '#E8B4D4'},
    {'stas_code': '1101', 'name': 'SERVICIUL FINANCIAR CONTABIL ACHIZIȚII', 'unit_type': 'serviciu', 'parent': '1100', 'leadership': 0, 'execution': 2, 'order': 16, 'color': '#E8B4D4'},
    {'stas_code': '1102', 'name': 'SERVICIUL LOGISTIC', 'unit_type': 'serviciu', 'parent': '1100', 'leadership': 0, 'execution': 2, 'order': 17, 'color': '#E8B4D4'},
    {'stas_code': '1103', 'name': 'SERVICIUL INVESTIȚII', 'unit_type': 'serviciu', 'parent': '1100', 'leadership': 0, 'execution': 2, 'order': 18, 'color': '#E8B4D4'},
    {'stas_code': '1120', 'name': 'COMPARTIMENT ADMINISTRATIV', 'unit_type': 'compartiment', 'parent': '1100', 'leadership': 1, 'execution': 18, 'order': 19, 'color': '#E8B4D4'},
    {'stas_code': '1200', 'name': 'DEPARTAMENT CERTIFICARE EPI', 'unit_type': 'compartiment', 'parent': None, 'leadership': 1, 'execution': 0, 'order': 20, 'color': '#F4E03C'},
    {'stas_code': '1210', 'name': 'SERVICIUL INSPECȚII', 'unit_type': 'serviciu', 'parent': '1200', 'leadership': 1, 'execution': 11, 'order': 21, 'color': '#F4E03C'},
    {'stas_code': '1220', 'name': 'SERVICIUL AUTORIZĂRI', 'unit_type': 'serviciu', 'parent': '1200', 'leadership': 1, 'execution': 11, 'order': 22, 'color': '#F4E03C'},
    {'stas_code': '2000', 'name': 'DIRECȚIA INSPECȚIONARE DE SIGURANȚĂ FEROVIARĂ ȘI CERTIFICARE PERSONAL', 'unit_type': 'directie', 'parent': None, 'leadership': 1, 'execution': 0, 'order': 23, 'color': '#8CB4D4'},
    {'stas_code': '2001', 'name': 'SERVICIUL INSPECȚII SIGURANȚĂ FEROVIARĂ', 'unit_type': 'serviciu', 'parent': '2000', 'leadership': 0, 'execution': 5, 'order': 24, 'color': '#8CB4D4'},
    {'stas_code': '2010', 'name': 'SERVICIUL AUTORIZĂRI VEHICULE FEROVIARE', 'unit_type': 'serviciu', 'parent': '2000', 'leadership': 0, 'execution': 5, 'order': 25, 'color': '#8CB4D4'},
    {'stas_code': '2020', 'name': 'SERVICIUL CERTIFICARE PERSONAL FEROVIAR', 'unit_type': 'serviciu', 'parent': '2000', 'leadership': 0, 'execution': 5, 'order': 26, 'color': '#8CB4D4'},
    {'stas_code': '2030', 'name': 'SERVICIUL AUTORIZĂRI INFRASTRUCTURĂ FEROVIARĂ', 'unit_type': 'serviciu', 'parent': '2000', 'leadership': 0, 'execution': 5, 'order': 27, 'color': '#8CB4D4'},
    {'stas_code': '2031', 'name': 'COMPARTIMENT MONITORIZARE EVENIMENTE FEROVIARE', 'unit_type': 'compartiment', 'parent': '2030', 'leadership': 0, 'execution': 8, 'order': 28, 'color': '#8CB4D4'},
    {'stas_code': '2040', 'name': 'SERVICIUL CERTIFICARE ENTITĂȚI ÎN SIGURANȚA FEROVIARĂ', 'unit_type': 'serviciu', 'parent': '2000', 'leadership': 0, 'execution': 5, 'order': 29, 'color': '#8CB4D4'},
    {'stas_code': '2041', 'name': 'COMPARTIMENT AUTORIZĂRI OPERATORI FEROVIARI', 'unit_type': 'compartiment', 'parent': '2040', 'leadership': 0, 'execution': 9, 'order': 30, 'color': '#8CB4D4'},
    {'stas_code': '2050', 'name': 'SERVICIUL AUTORIZĂRI SUBSISTEME STRUCTURALE', 'unit_type': 'serviciu', 'parent': '2000', 'leadership': 0, 'execution': 5, 'order': 31, 'color': '#8CB4D4'},
    {'stas_code': '2060', 'name': 'SERVICIUL CERTIFICARE COMPONENTE INTEROPERABILITATE', 'unit_type': 'serviciu', 'parent': '2000', 'leadership': 0, 'execution': 5, 'order': 32, 'color': '#8CB4D4'},
    {'stas_code': '3000', 'name': 'DIRECȚIA AUTORIZĂRI DE SIGURANȚĂ LA FLACARĂȘI PREVENIRE', 'unit_type': 'directie', 'parent': None, 'leadership': 1, 'execution': 0, 'order': 33, 'color': '#F4A43C'},
    {'stas_code': '3001', 'name': 'SERVICIUL AUTORIZĂRI INSTALAȚII TEHNOLOGICE', 'unit_type': 'serviciu', 'parent': '3000', 'leadership': 0, 'execution': 5, 'order': 34, 'color': '#F4A43C'},
    {'stas_code': '3002', 'name': 'SERVICIUL AUTORIZĂRI CONSTRUCȚII', 'unit_type': 'serviciu', 'parent': '3000', 'leadership': 0, 'execution': 5, 'order': 35, 'color': '#F4A43C'},
    {'stas_code': '3003', 'name': 'SERVICIUL INSPECȚII PREVENIRE', 'unit_type': 'serviciu', 'parent': '3000', 'leadership': 0, 'execution': 5, 'order': 36, 'color': '#F4A43C'},
    {'stas_code': '3004', 'name': 'SERVICIUL CERTIFICARE PRODUSE', 'unit_type': 'serviciu', 'parent': '3000', 'leadership': 0, 'execution': 5, 'order': 37, 'color': '#F4A43C'},
]

# Custom positions from backup
positions = {
    '1000': (1580, -20, 380, 60),
    '330': (600, 180, None, None),
    'LEGEND': (420, 20, None, None),
    '1001': (280, 180, 280, 40),
    '1002': (280, 240, 280, 40),
    '1010': (1340, 300, 280, 40),
    '1011': (1660, 300, 300, 40),
    '1012': (1660, 360, 300, 40),
    '1020': (1340, 180, 280, 40),
    '1021': (1660, 180, 300, 40),
    '1022': (1660, 240, 300, 40),
    '1030': (580, 300, 280, 40),
    '1031': (280, 300, 280, 40),
    '1040': (1340, 420, 280, 40),
    '1051': (1660, 480, 300, 40),
    '1052': (1660, 540, 300, 40),
    '1100': (460, 620, 340, 60),
    '1101': (480, 1060, 240, 40),
    '1102': (560, 1060, 240, 40),
    '1103': (640, 1060, 240, 40),
    '1120': (400, 820, 240, 40),
    '1200': (900, 620, 360, 60),
    '1210': (900, 820, 260, 60),
    '1220': (1020, 820, 260, 60),
    '2000': (1360, 620, 540, 60),
    '2001': (1280, 1040, 220, 80),
    '2010': (1360, 800, 220, 60),
    '2020': (1440, 800, 220, 60),
    '2030': (1520, 800, 220, 60),
    '2031': (1500, 1040, 220, 80),
    '2040': (1600, 800, 220, 60),
    '2041': (1620, 1040, 220, 80),
    '2050': (1680, 800, 220, 60),
    '2060': (1760, 800, 220, 60),
    '3000': (1940, 620, 340, 60),
    '3001': (1880, 800, 220, 60),
    '3002': (1960, 800, 220, 60),
    '3003': (2040, 800, 220, 60),
    '3004': (2120, 800, 220, 60),
}

def restore_version():
    db = SessionLocal()
    
    try:
        # Create version
        version = OrgVersion(
            version_number="49/23.01.2026",
            name="CODIFICAREA STRUCTURILOR DIN ANEXA LA OMTI NR. 49/23.01.2026",
            status="draft",
            chart_title="CODIFICAREA STRUCTURILOR DIN ANEXA LA OMTI NR. 49/23.01.2026",
            org_type="codificare",
            created_date=datetime.utcnow()
        )
        db.add(version)
        db.flush()
        
        print(f"Created version: {version.name}")
        
        # Create units
        unit_map = {}  # Map stas_code to unit id
        
        # First pass: create all units
        for unit_data in units_data:
            unit = OrgUnit(
                version_id=version.id,
                stas_code=unit_data['stas_code'],
                name=unit_data['name'],
                unit_type=unit_data['unit_type'],
                order_index=unit_data['order'],
                leadership_count=unit_data['leadership'],
                execution_count=unit_data['execution'],
                color=unit_data.get('color'),
                parent_unit_id=None  # Will set in second pass
            )
            
            # Add custom positions
            if unit_data['stas_code'] in positions:
                x, y, w, h = positions[unit_data['stas_code']]
                unit.custom_x = x
                unit.custom_y = y
                unit.custom_width = w
                unit.custom_height = h
            
            # Special fields for director_general
            if unit_data['unit_type'] == 'director_general':
                unit.director_title = "DIRECTOR GENERAL"
                unit.director_name = "Petru BOGDAN"
            
            # Special fields for legend
            if unit_data['unit_type'] == 'legend':
                unit.legend_col1 = "NUMĂR POSTURI CONDUCERE"
                unit.legend_col2 = "TOTAL POSTURI INCLUS CONDUCERE"
                unit.legend_col3 = "DENUMIRE STRUCTURĂ"
            
            db.add(unit)
            db.flush()
            unit_map[unit_data['stas_code']] = unit.id
        
        # Second pass: set parent relationships
        for unit_data in units_data:
            if unit_data['parent']:
                unit = db.query(OrgUnit).filter(
                    OrgUnit.version_id == version.id,
                    OrgUnit.stas_code == unit_data['stas_code']
                ).first()
                if unit and unit_data['parent'] in unit_map:
                    unit.parent_unit_id = unit_map[unit_data['parent']]
        
        db.commit()
        print(f"✓ Restored version with {len(units_data)} units")
        
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    restore_version()
