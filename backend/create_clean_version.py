#!/usr/bin/env python3
"""Create a clean version without custom positions"""

from app.database import SessionLocal
from app.models import OrgVersion, OrgUnit
from datetime import datetime

# Unit data - clean without custom positions
units_data = [
    {'stas_code': '330', 'name': 'CONSILIU DE CONDUCERE', 'unit_type': 'consiliu', 'parent': None, 'leadership': 0, 'execution': 0},
    {'stas_code': 'LEGEND', 'name': 'Legendă', 'unit_type': 'legend', 'parent': None, 'leadership': 0, 'execution': 0},
    {'stas_code': '1000', 'name': 'DIRECTOR GENERAL', 'unit_type': 'director_general', 'parent': None, 'leadership': 1, 'execution': 0, 'color': '#86C67C-full'},
    {'stas_code': '1001', 'name': 'SERVICIUL RESURSE UMANE', 'unit_type': 'serviciu', 'parent': '1000', 'leadership': 1, 'execution': 0, 'color': '#86C67C'},
    {'stas_code': '1002', 'name': 'SERVICIUL JURIDIC', 'unit_type': 'serviciu', 'parent': '1000', 'leadership': 0, 'execution': 3, 'color': '#86C67C'},
    {'stas_code': '1010', 'name': 'COMPARTIMENT AUDIT INTERN', 'unit_type': 'compartiment', 'parent': '1000', 'leadership': 0, 'execution': 2, 'color': '#86C67C'},
    {'stas_code': '1011', 'name': 'COMPARTIMENT REGISTRATURA, ARHIVA', 'unit_type': 'compartiment', 'parent': '1010', 'leadership': 0, 'execution': 2, 'color': '#86C67C'},
    {'stas_code': '1012', 'name': 'COMPARTIMENT SIM, SU', 'unit_type': 'compartiment', 'parent': '1010', 'leadership': 0, 'execution': 2, 'color': '#86C67C'},
    {'stas_code': '1020', 'name': 'DISPECERAT 112', 'unit_type': 'serviciu', 'parent': '1000', 'leadership': 1, 'execution': 18, 'color': '#86C67C'},
    {'stas_code': '1021', 'name': 'COMPARTIMENT SOLUȚIONARE DE SIGURANȚĂ CIBERNETICĂ', 'unit_type': 'compartiment', 'parent': '1020', 'leadership': 0, 'execution': 2, 'color': '#86C67C'},
    {'stas_code': '1022', 'name': 'COMPARTIMENT DREPTUL CALITĂȚII', 'unit_type': 'compartiment', 'parent': '1020', 'leadership': 0, 'execution': 2, 'color': '#86C67C'},
    {'stas_code': '1030', 'name': 'SERVICIUL COMUNICARE', 'unit_type': 'serviciu', 'parent': '1000', 'leadership': 1, 'execution': 3, 'color': '#86C67C'},
    {'stas_code': '1031', 'name': 'SERVICIUL CONTROL SI SIGURANȚA CIRCULAȚIEI', 'unit_type': 'serviciu', 'parent': '1030', 'leadership': 0, 'execution': 2, 'color': '#86C67C'},
    {'stas_code': '1040', 'name': 'COMPARTIMENT CERTIFICARE OMF', 'unit_type': 'compartiment', 'parent': '1000', 'leadership': 1, 'execution': 11, 'color': '#86C67C'},
    {'stas_code': '1051', 'name': 'COMPARTIMENT CONSILIERI OFICIALI RECUNOȘTERE UNITĂȚI DE INTERVENȚIE', 'unit_type': 'compartiment', 'parent': '1040', 'leadership': 0, 'execution': 2, 'color': '#86C67C'},
    {'stas_code': '1052', 'name': 'COMPARTIMENT AUTORIZĂRI DE SIGURANȚĂ LA FLACARĂȘI PREVENIRE', 'unit_type': 'compartiment', 'parent': '1040', 'leadership': 0, 'execution': 2, 'color': '#86C67C'},
    {'stas_code': '1100', 'name': 'DIRECȚIA ECONOMICĂ', 'unit_type': 'directie', 'parent': None, 'leadership': 1, 'execution': 0, 'color': '#E8B4D4-full'},
    {'stas_code': '1101', 'name': 'SERVICIUL FINANCIAR CONTABIL ACHIZIȚII', 'unit_type': 'serviciu', 'parent': '1100', 'leadership': 0, 'execution': 2, 'color': '#E8B4D4'},
    {'stas_code': '1102', 'name': 'SERVICIUL LOGISTIC', 'unit_type': 'serviciu', 'parent': '1100', 'leadership': 0, 'execution': 2, 'color': '#E8B4D4'},
    {'stas_code': '1103', 'name': 'SERVICIUL INVESTIȚII', 'unit_type': 'serviciu', 'parent': '1100', 'leadership': 0, 'execution': 2, 'color': '#E8B4D4'},
    {'stas_code': '1120', 'name': 'COMPARTIMENT ADMINISTRATIV', 'unit_type': 'compartiment', 'parent': '1100', 'leadership': 1, 'execution': 18, 'color': '#E8B4D4'},
    {'stas_code': '1200', 'name': 'DEPARTAMENT CERTIFICARE EPI', 'unit_type': 'directie', 'parent': None, 'leadership': 1, 'execution': 0, 'color': '#F4E03C-full'},
    {'stas_code': '1210', 'name': 'SERVICIUL INSPECȚII', 'unit_type': 'serviciu', 'parent': '1200', 'leadership': 1, 'execution': 11, 'color': '#F4E03C'},
    {'stas_code': '1220', 'name': 'SERVICIUL AUTORIZĂRI', 'unit_type': 'serviciu', 'parent': '1200', 'leadership': 1, 'execution': 11, 'color': '#F4E03C'},
    {'stas_code': '2000', 'name': 'DIRECȚIA INSPECȚIONARE DE SIGURANȚĂ FEROVIARĂ ȘI CERTIFICARE PERSONAL', 'unit_type': 'directie', 'parent': None, 'leadership': 1, 'execution': 0, 'color': '#8CB4D4-full'},
    {'stas_code': '2001', 'name': 'SERVICIUL INSPECȚII SIGURANȚĂ FEROVIARĂ', 'unit_type': 'serviciu', 'parent': '2000', 'leadership': 0, 'execution': 5, 'color': '#8CB4D4'},
    {'stas_code': '2010', 'name': 'SERVICIUL AUTORIZĂRI VEHICULE FEROVIARE', 'unit_type': 'serviciu', 'parent': '2000', 'leadership': 0, 'execution': 5, 'color': '#8CB4D4'},
    {'stas_code': '2020', 'name': 'SERVICIUL CERTIFICARE PERSONAL FEROVIAR', 'unit_type': 'serviciu', 'parent': '2000', 'leadership': 0, 'execution': 5, 'color': '#8CB4D4'},
    {'stas_code': '2030', 'name': 'SERVICIUL AUTORIZĂRI INFRASTRUCTURĂ FEROVIARĂ', 'unit_type': 'serviciu', 'parent': '2000', 'leadership': 0, 'execution': 5, 'color': '#8CB4D4'},
    {'stas_code': '2031', 'name': 'COMPARTIMENT MONITORIZARE EVENIMENTE FEROVIARE', 'unit_type': 'compartiment', 'parent': '2030', 'leadership': 0, 'execution': 8, 'color': '#8CB4D4'},
    {'stas_code': '2040', 'name': 'SERVICIUL CERTIFICARE ENTITĂȚI ÎN SIGURANȚA FEROVIARĂ', 'unit_type': 'serviciu', 'parent': '2000', 'leadership': 0, 'execution': 5, 'color': '#8CB4D4'},
    {'stas_code': '2041', 'name': 'COMPARTIMENT AUTORIZĂRI OPERATORI FEROVIARI', 'unit_type': 'compartiment', 'parent': '2040', 'leadership': 0, 'execution': 9, 'color': '#8CB4D4'},
    {'stas_code': '2050', 'name': 'SERVICIUL AUTORIZĂRI SUBSISTEME STRUCTURALE', 'unit_type': 'serviciu', 'parent': '2000', 'leadership': 0, 'execution': 5, 'color': '#8CB4D4'},
    {'stas_code': '2060', 'name': 'SERVICIUL CERTIFICARE COMPONENTE INTEROPERABILITATE', 'unit_type': 'serviciu', 'parent': '2000', 'leadership': 0, 'execution': 5, 'color': '#8CB4D4'},
    {'stas_code': '3000', 'name': 'DIRECȚIA AUTORIZĂRI DE SIGURANȚĂ LA FLACARĂȘI PREVENIRE', 'unit_type': 'directie', 'parent': None, 'leadership': 1, 'execution': 0, 'color': '#F4A43C-full'},
    {'stas_code': '3001', 'name': 'SERVICIUL AUTORIZĂRI INSTALAȚII TEHNOLOGICE', 'unit_type': 'serviciu', 'parent': '3000', 'leadership': 0, 'execution': 5, 'color': '#F4A43C'},
    {'stas_code': '3002', 'name': 'SERVICIUL AUTORIZĂRI CONSTRUCȚII', 'unit_type': 'serviciu', 'parent': '3000', 'leadership': 0, 'execution': 5, 'color': '#F4A43C'},
    {'stas_code': '3003', 'name': 'SERVICIUL INSPECȚII PREVENIRE', 'unit_type': 'serviciu', 'parent': '3000', 'leadership': 0, 'execution': 5, 'color': '#F4A43C'},
    {'stas_code': '3004', 'name': 'SERVICIUL CERTIFICARE PRODUSE', 'unit_type': 'serviciu', 'parent': '3000', 'leadership': 0, 'execution': 5, 'color': '#F4A43C'},
]

def create_version():
    db = SessionLocal()
    
    try:
        # Create version
        version = OrgVersion(
            version_number="49/23.01.2026",
            name="CODIFICAREA STRUCTURILOR DIN ANEXA LA OMTI NR. 49/23.01.2026",
            status="draft",
            chart_title="CODIFICAREA STRUCTURILOR DIN ANEXA LA OMTI NR. 49/23.01.2026",
            org_type="codificare",
            created_date=datetime.now()
        )
        db.add(version)
        db.flush()
        
        print(f"Created version: {version.name}")
        
        # Create units
        unit_map = {}
        
        # First pass: create all units
        for unit_data in units_data:
            unit = OrgUnit(
                version_id=version.id,
                stas_code=unit_data['stas_code'],
                name=unit_data['name'],
                unit_type=unit_data['unit_type'],
                order_index=0,
                leadership_count=unit_data['leadership'],
                execution_count=unit_data['execution'],
                color=unit_data.get('color'),
                parent_unit_id=None
            )
            
            # Special fields
            if unit_data['unit_type'] == 'director_general':
                unit.director_title = "DIRECTOR GENERAL"
                unit.director_name = "Petru BOGDAN"
            
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
        print(f"✓ Created version with {len(units_data)} units (clean layout)")
        
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    create_version()
