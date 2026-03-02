-- Create unit_types table for dynamic unit type management
CREATE TABLE IF NOT EXISTS unit_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    label VARCHAR(100) NOT NULL,
    order_index INTEGER DEFAULT 0,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default unit types
INSERT INTO unit_types (code, label, order_index, is_system) VALUES
    ('director_general', 'Director General', 1, TRUE),
    ('serviciu', 'Serviciu', 2, TRUE),
    ('compartiment', 'Compartiment', 3, TRUE),
    ('consilieri', 'Consilieri', 4, FALSE),
    ('dispecerat', 'Dispecerat', 5, FALSE),
    ('departament', 'Departament', 6, FALSE),
    ('directie', 'Direcție', 7, FALSE),
    ('inspectorat', 'Inspectorat', 8, FALSE),
    ('consiliu', 'Consiliu de Conducere', 99, TRUE),
    ('legend', 'Legendă', 100, TRUE)
ON CONFLICT (code) DO NOTHING;
