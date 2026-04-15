-- ============================================================================
-- ASFR Generator Organigramă — Schema inițială completă
-- Migrare: 000_initial_schema.sql
-- Data: 2026-03-31
-- ============================================================================

-- Extensie pentru UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE version_status AS ENUM ('draft', 'pending_approval', 'approved', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE org_type AS ENUM ('codificare', 'omti');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE employee_status AS ENUM ('active', 'on_leave', 'terminated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE position_type AS ENUM ('leadership', 'execution');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- USERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR UNIQUE NOT NULL,
    full_name VARCHAR,
    hashed_password VARCHAR NOT NULL,
    role VARCHAR DEFAULT 'viewer',
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- ORG VERSIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS org_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version_number VARCHAR NOT NULL,
    name VARCHAR NOT NULL,
    status version_status DEFAULT 'draft' NOT NULL,
    notes TEXT,
    chart_title VARCHAR DEFAULT 'CODIFICAREA STRUCTURILOR DIN ANEXA LA OMTI NR. 48/23.01.2026',
    org_type org_type DEFAULT 'codificare' NOT NULL,
    created_date TIMESTAMP DEFAULT NOW() NOT NULL,
    valid_from DATE,
    valid_until DATE,
    approved_by VARCHAR,
    approved_at TIMESTAMP,
    approved_date TIMESTAMP,
    snapshot_image TEXT,
    units_snapshot TEXT
);

-- ============================================================================
-- ORGANIZATIONAL UNITS
-- ============================================================================

CREATE TABLE IF NOT EXISTS organizational_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version_id UUID NOT NULL REFERENCES org_versions(id) ON DELETE CASCADE,
    stas_code VARCHAR NOT NULL,
    name VARCHAR NOT NULL,
    unit_type VARCHAR NOT NULL,
    parent_unit_id UUID REFERENCES organizational_units(id),
    order_index INTEGER DEFAULT 0,
    leadership_count INTEGER DEFAULT 0,
    execution_count INTEGER DEFAULT 0,
    color VARCHAR,
    custom_x INTEGER,
    custom_y INTEGER,
    custom_height INTEGER,
    custom_width INTEGER,
    director_title VARCHAR,
    director_name VARCHAR,
    legend_col1 VARCHAR,
    legend_col2 VARCHAR,
    legend_col3 VARCHAR,
    is_rotated BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_units_version ON organizational_units(version_id);
CREATE INDEX IF NOT EXISTS idx_units_parent ON organizational_units(parent_unit_id);

-- ============================================================================
-- POSITIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version_id UUID NOT NULL REFERENCES org_versions(id) ON DELETE CASCADE,
    unit_id UUID NOT NULL REFERENCES organizational_units(id) ON DELETE CASCADE,
    title VARCHAR NOT NULL,
    is_leadership BOOLEAN DEFAULT FALSE NOT NULL,
    grade VARCHAR,
    is_vacant BOOLEAN DEFAULT TRUE,
    order_index INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_positions_version ON positions(version_id);
CREATE INDEX IF NOT EXISTS idx_positions_unit ON positions(unit_id);

-- ============================================================================
-- EMPLOYEES
-- ============================================================================

CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR NOT NULL,
    last_name VARCHAR NOT NULL,
    email VARCHAR,
    phone VARCHAR,
    hire_date DATE,
    status employee_status DEFAULT 'active',
    active BOOLEAN DEFAULT TRUE,
    unit_id UUID REFERENCES organizational_units(id),
    position_type position_type
);

-- ============================================================================
-- POSITION ASSIGNMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS position_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    position_id UUID NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE
);

-- ============================================================================
-- UNIT TYPES (configurabile din Settings)
-- ============================================================================

CREATE TABLE IF NOT EXISTS unit_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    label VARCHAR(100) NOT NULL,
    order_index INTEGER DEFAULT 0,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- OMTI SNAPSHOTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS omti_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version_id UUID NOT NULL REFERENCES org_versions(id) ON DELETE CASCADE,
    image TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_omti_snapshots_version ON omti_snapshots(version_id);
CREATE INDEX IF NOT EXISTS idx_omti_snapshots_created ON omti_snapshots(created_at DESC);

-- ============================================================================
-- SYSTEM SETTINGS (template persistent, etc.)
-- ============================================================================

CREATE TABLE IF NOT EXISTS system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- SEED: tipuri de unitate implicite
-- ============================================================================

INSERT INTO unit_types (code, label, order_index, is_system) VALUES
    ('director_general', 'Director General', 1, TRUE),
    ('directie', 'Direcție', 2, TRUE),
    ('departament', 'Departament', 3, TRUE),
    ('serviciu', 'Serviciu', 4, TRUE),
    ('compartiment', 'Compartiment', 5, TRUE),
    ('inspectorat', 'Inspectorat', 6, TRUE),
    ('birou', 'Birou', 7, TRUE),
    ('consiliu', 'Consiliu de Conducere', 8, TRUE),
    ('legend', 'Legendă', 9, TRUE)
ON CONFLICT (code) DO NOTHING;
