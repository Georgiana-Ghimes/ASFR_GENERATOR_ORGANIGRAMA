-- ============================================================================
-- ASFR Generator Organigramă — Seed: versiunea curentă cu toate unitățile
-- Migrare: 001_seed_current_data.sql
-- Conține: versiunea 49/23.01.2026 cu 37 unități, 2 useri
-- ============================================================================

-- ============================================================================
-- VERSIUNE
-- ============================================================================

INSERT INTO org_versions (id, version_number, name, status, notes, chart_title, org_type, created_date)
VALUES (
    '8ee3c3ff-de57-4fc1-ba18-29897a43ae89',
    '49/23.01.2026',
    'CODIFICAREA STRUCTURILOR DIN ANEXA LA OMTI NR. 49/23.01.2026',
    'draft',
    NULL,
    'CODIFICAREA STRUCTURILOR DIN ANEXA LA OMTI NR. 49/23.01.2026',
    'codificare',
    '2026-03-02 12:46:21.505751'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- UNITĂȚI ORGANIZAȚIONALE (37 unități)
-- ============================================================================

-- Director General (root)
INSERT INTO organizational_units (id, version_id, stas_code, name, unit_type, parent_unit_id, order_index, leadership_count, execution_count, color, custom_x, custom_y, custom_height, custom_width, director_title, director_name, is_rotated)
VALUES ('a160ee41-55b9-4dbc-8f4d-1513b2e74c63', '8ee3c3ff-de57-4fc1-ba18-29897a43ae89', '1000', 'DIRECTOR GENERAL', 'director_general', NULL, 0, 1, 0, '#86C67C-full', 1000, 200, 60, 380, 'DIRECTOR GENERAL', 'Petru BOGDAN', false)
ON CONFLICT (id) DO NOTHING;

-- Consilieri Director General
INSERT INTO organizational_units (id, version_id, stas_code, name, unit_type, parent_unit_id, order_index, leadership_count, execution_count, color, custom_x, custom_y, custom_height, custom_width, is_rotated)
VALUES ('7f3ccfca-4fae-4684-9f1a-6a3b6ab4602a', '8ee3c3ff-de57-4fc1-ba18-29897a43ae89', '1001', 'CONSILIERI DIRECTOR GENERAL', 'consilieri', 'a160ee41-55b9-4dbc-8f4d-1513b2e74c63', 0, 0, 2, '#86C67C', 300, 200, 60, 320, false)
ON CONFLICT (id) DO NOTHING;

-- Compartiment Audit Intern
INSERT INTO organizational_units (id, version_id, stas_code, name, unit_type, parent_unit_id, order_index, leadership_count, execution_count, color, custom_x, custom_y, custom_height, custom_width, is_rotated)
VALUES ('e3650618-9a54-4b8d-b938-494ba0804037', '8ee3c3ff-de57-4fc1-ba18-29897a43ae89', '1002', 'COMPARTIMENT AUDIT INTERN', 'compartiment', 'a160ee41-55b9-4dbc-8f4d-1513b2e74c63', 0, 0, 3, '#86C67C', 300, 280, 60, 320, false)
ON CONFLICT (id) DO NOTHING;

-- Serviciul Juridic
INSERT INTO organizational_units (id, version_id, stas_code, name, unit_type, parent_unit_id, order_index, leadership_count, execution_count, color, custom_x, custom_y, custom_height, custom_width, is_rotated)
VALUES ('71ac44e4-92d6-4ff0-bdb4-df8f9b38b817', '8ee3c3ff-de57-4fc1-ba18-29897a43ae89', '1010', 'SERVICIUL JURIDIC', 'serviciu', 'a160ee41-55b9-4dbc-8f4d-1513b2e74c63', 0, 1, 3, '#86C67C', 1420, 360, 60, 320, false)
ON CONFLICT (id) DO NOTHING;

-- Compartiment Reglementări de Siguranță Feroviară
INSERT INTO organizational_units (id, version_id, stas_code, name, unit_type, parent_unit_id, order_index, leadership_count, execution_count, color, custom_x, custom_y, custom_height, custom_width, is_rotated)
VALUES ('2e997c50-2501-4fa0-bc1d-2ea590bdf6a6', '8ee3c3ff-de57-4fc1-ba18-29897a43ae89', '1011', 'COMPARTIMENT REGLEMENTĂRI DE SIGURANȚĂ FEROVIARĂ', 'compartiment', '71ac44e4-92d6-4ff0-bdb4-df8f9b38b817', 0, 0, 4, '#86C67C', 1800, 360, 60, 380, false)
ON CONFLICT (id) DO NOTHING;

-- Compartiment Drepturi Călători
INSERT INTO organizational_units (id, version_id, stas_code, name, unit_type, parent_unit_id, order_index, leadership_count, execution_count, color, custom_x, custom_y, custom_height, custom_width, is_rotated)
VALUES ('46b2bcc4-3131-4460-adcb-0682623384fd', '8ee3c3ff-de57-4fc1-ba18-29897a43ae89', '1012', 'COMPARTIMENT DREPTURI CĂLĂTORI', 'compartiment', '71ac44e4-92d6-4ff0-bdb4-df8f9b38b817', 0, 0, 3, '#86C67C', 1800, 440, 60, 380, false)
ON CONFLICT (id) DO NOTHING;

-- Serviciul Resurse Umane
INSERT INTO organizational_units (id, version_id, stas_code, name, unit_type, parent_unit_id, order_index, leadership_count, execution_count, color, custom_x, custom_y, custom_height, custom_width, is_rotated)
VALUES ('bf849b5e-30a2-48bf-8e82-eb02697b54e4', '8ee3c3ff-de57-4fc1-ba18-29897a43ae89', '1020', 'SERVICIUL RESURSE UMANE', 'serviciu', 'a160ee41-55b9-4dbc-8f4d-1513b2e74c63', 0, 1, 5, '#86C67C', 1420, 200, 60, 320, false)
ON CONFLICT (id) DO NOTHING;

-- Compartiment Registratură, Arhivă
INSERT INTO organizational_units (id, version_id, stas_code, name, unit_type, parent_unit_id, order_index, leadership_count, execution_count, color, custom_x, custom_y, custom_height, custom_width, is_rotated)
VALUES ('2234d770-490c-4fa3-b88d-8471aee1cf20', '8ee3c3ff-de57-4fc1-ba18-29897a43ae89', '1021', 'COMPARTIMENT REGISTRATURĂ, ARHIVĂ', 'compartiment', 'bf849b5e-30a2-48bf-8e82-eb02697b54e4', 0, 0, 3, '#86C67C', 1800, 200, 60, 380, false)
ON CONFLICT (id) DO NOTHING;

-- Compartiment SSM, SU
INSERT INTO organizational_units (id, version_id, stas_code, name, unit_type, parent_unit_id, order_index, leadership_count, execution_count, color, custom_x, custom_y, custom_height, custom_width, is_rotated)
VALUES ('5dbff5ac-8a67-4bce-ad0f-8ef53b6843fa', '8ee3c3ff-de57-4fc1-ba18-29897a43ae89', '1022', 'COMPARTIMENT SSM, SU', 'compartiment', 'bf849b5e-30a2-48bf-8e82-eb02697b54e4', 0, 0, 2, '#86C67C', 1800, 280, 60, 380, false)
ON CONFLICT (id) DO NOTHING;

-- Serviciul Comunicare
INSERT INTO organizational_units (id, version_id, stas_code, name, unit_type, parent_unit_id, order_index, leadership_count, execution_count, color, custom_x, custom_y, custom_height, custom_width, is_rotated)
VALUES ('701893c4-ecd5-40e5-b1fe-6e8894140558', '8ee3c3ff-de57-4fc1-ba18-29897a43ae89', '1030', 'SERVICIUL COMUNICARE', 'serviciu', 'a160ee41-55b9-4dbc-8f4d-1513b2e74c63', 0, 1, 6, '#86C67C', 660, 360, 60, 300, false)
ON CONFLICT (id) DO NOTHING;

-- Dispecerat 112
INSERT INTO organizational_units (id, version_id, stas_code, name, unit_type, parent_unit_id, order_index, leadership_count, execution_count, color, custom_x, custom_y, custom_height, custom_width, is_rotated)
VALUES ('a501221e-f7ee-45cb-a3b4-ed2c220a30d3', '8ee3c3ff-de57-4fc1-ba18-29897a43ae89', '1031', 'DISPECERAT 112', 'dispecerat', '701893c4-ecd5-40e5-b1fe-6e8894140558', 0, 0, 5, '#86C67C', 300, 360, 60, 320, false)
ON CONFLICT (id) DO NOTHING;

-- Serviciul Control și Siguranța Circulației
INSERT INTO organizational_units (id, version_id, stas_code, name, unit_type, parent_unit_id, order_index, leadership_count, execution_count, color, custom_x, custom_y, custom_height, custom_width, is_rotated)
VALUES ('8d49659a-9271-4c2d-8c29-1714161d19a4', '8ee3c3ff-de57-4fc1-ba18-29897a43ae89', '1040', 'SERVICIUL CONTROL ȘI SIGURANȚA CIRCULAȚIEI', 'serviciu', 'a160ee41-55b9-4dbc-8f4d-1513b2e74c63', 0, 1, 10, '#86C67C', 1420, 520, 60, 320, false)
ON CONFLICT (id) DO NOTHING;

-- Compartiment Certificare OTF
INSERT INTO organizational_units (id, version_id, stas_code, name, unit_type, parent_unit_id, order_index, leadership_count, execution_count, color, custom_x, custom_y, custom_height, custom_width, is_rotated)
VALUES ('a6f1f9f8-cb77-452f-9ea1-ad051aa3f130', '8ee3c3ff-de57-4fc1-ba18-29897a43ae89', '1051', 'COMPARTIMENT CERTIFICARE OTF, RECUNOAȘTERE CENTRE DE FORMARE', 'compartiment', 'a160ee41-55b9-4dbc-8f4d-1513b2e74c63', 0, 0, 4, '#86C67C', 1800, 600, 60, 380, false)
ON CONFLICT (id) DO NOTHING;

-- Compartiment Certificare OMF
INSERT INTO organizational_units (id, version_id, stas_code, name, unit_type, parent_unit_id, order_index, leadership_count, execution_count, color, custom_x, custom_y, custom_height, custom_width, is_rotated)
VALUES ('90e4ffd0-315b-4654-97a6-89cb38240f0a', '8ee3c3ff-de57-4fc1-ba18-29897a43ae89', '1052', 'COMPARTIMENT CERTIFICARE OMF', 'compartiment', 'a160ee41-55b9-4dbc-8f4d-1513b2e74c63', 0, 0, 2, '#86C67C', 1800, 680, 60, 380, false)
ON CONFLICT (id) DO NOTHING;

-- Direcția Economică
INSERT INTO organizational_units (id, version_id, stas_code, name, unit_type, parent_unit_id, order_index, leadership_count, execution_count, color, custom_x, custom_y, custom_height, custom_width, is_rotated)
VALUES ('1d8c1c2c-a093-431d-aa30-4c3f51b9a1d6', '8ee3c3ff-de57-4fc1-ba18-29897a43ae89', '1100', 'DIRECȚIA ECONOMICĂ', 'directie', 'a160ee41-55b9-4dbc-8f4d-1513b2e74c63', 0, 1, 14, '#E8B4D4-full', 160, 780, 100, 420, false)
ON CONFLICT (id) DO NOTHING;

-- Compartiment Control Financiar Preventiv
INSERT INTO organizational_units (id, version_id, stas_code, name, unit_type, parent_unit_id, order_index, leadership_count, execution_count, color, custom_x, custom_y, custom_height, custom_width, is_rotated)
VALUES ('7b43a8c9-86c7-486b-a909-f3715a7b4ae4', '8ee3c3ff-de57-4fc1-ba18-29897a43ae89', '1101', 'COMPARTIMENT CONTROL FINANCIAR PREVENTIV', 'compartiment', '1d8c1c2c-a093-431d-aa30-4c3f51b9a1d6', 0, 0, 2, '#E8B4D4', 200, 1420, 80, 340, true)
ON CONFLICT (id) DO NOTHING;

-- Compartiment Financiar Salarii și Buget
INSERT INTO organizational_units (id, version_id, stas_code, name, unit_type, parent_unit_id, order_index, leadership_count, execution_count, color, custom_x, custom_y, custom_height, custom_width, is_rotated)
VALUES ('5b93bb6a-2e36-4ae9-8562-b30da4ee9112', '8ee3c3ff-de57-4fc1-ba18-29897a43ae89', '1102', 'COMPARTIMENT FINANCIAR SALARII ȘI BUGET', 'compartiment', '1d8c1c2c-a093-431d-aa30-4c3f51b9a1d6', 0, 0, 6, '#E8B4D4', 300, 1420, 80, 340, true)
ON CONFLICT (id) DO NOTHING;

-- Compartiment Contabilitate, Facturare, Casierie
INSERT INTO organizational_units (id, version_id, stas_code, name, unit_type, parent_unit_id, order_index, leadership_count, execution_count, color, custom_x, custom_y, custom_height, custom_width, is_rotated)
VALUES ('b8537d67-0c63-4587-853d-24589865a97b', '8ee3c3ff-de57-4fc1-ba18-29897a43ae89', '1103', 'COMPARTIMENT CONTABILITATE, FACTURARE, CASIERIE', 'compartiment', '1d8c1c2c-a093-431d-aa30-4c3f51b9a1d6', 0, 0, 6, '#E8B4D4', 400, 1420, 80, 340, true)
ON CONFLICT (id) DO NOTHING;

-- Serviciul Tehnic Administrativ Achiziții
INSERT INTO organizational_units (id, version_id, stas_code, name, unit_type, parent_unit_id, order_index, leadership_count, execution_count, color, custom_x, custom_y, custom_height, custom_width, is_rotated)
VALUES ('898ee510-2935-4fba-8c29-9801a27f4056', '8ee3c3ff-de57-4fc1-ba18-29897a43ae89', '1120', 'SERVICIUL TEHNIC ADMINISTRATIV ACHIZIȚII', '', '1d8c1c2c-a093-431d-aa30-4c3f51b9a1d6', 0, 1, 3, '#E8B4D4', 20, 1060, 80, 360, true)
ON CONFLICT (id) DO NOTHING;

-- Departament Certificare ERI
INSERT INTO organizational_units (id, version_id, stas_code, name, unit_type, parent_unit_id, order_index, leadership_count, execution_count, color, custom_x, custom_y, custom_height, custom_width, is_rotated)
VALUES ('ea8641a9-ebce-4c02-8f93-8844a5506232', '8ee3c3ff-de57-4fc1-ba18-29897a43ae89', '1200', 'DEPARTAMENT CERTIFICARE ERI', 'departament', 'a160ee41-55b9-4dbc-8f4d-1513b2e74c63', 0, 1, 0, '#F4E03C-full', 620, 780, 100, 380, false)
ON CONFLICT (id) DO NOTHING;

-- Serviciul Certificare Entități Responsabile
INSERT INTO organizational_units (id, version_id, stas_code, name, unit_type, parent_unit_id, order_index, leadership_count, execution_count, color, custom_x, custom_y, custom_height, custom_width, is_rotated)
VALUES ('8a5dae9c-82ac-40dc-8773-3a22c84c6fec', '8ee3c3ff-de57-4fc1-ba18-29897a43ae89', '1210', 'SERVICIUL CERTIFICARE ENTITĂȚI RESPONSABILE CU ÎNTREȚINEREA VEHICULELOR FEROVIARE', 'serviciu', 'ea8641a9-ebce-4c02-8f93-8844a5506232', 0, 1, 10, '#F4E03C', 560, 1060, 80, 360, true)
ON CONFLICT (id) DO NOTHING;

-- Serviciul Certificare ERI Funcții Întreținere
INSERT INTO organizational_units (id, version_id, stas_code, name, unit_type, parent_unit_id, order_index, leadership_count, execution_count, color, custom_x, custom_y, custom_height, custom_width, is_rotated)
VALUES ('3da9ea26-9702-4a69-84c8-38e78a0663ab', '8ee3c3ff-de57-4fc1-ba18-29897a43ae89', '1220', 'SERVICIUL CERTIFICARE ERI FUNCȚII ÎNTREȚINERE, AUTORIZARE PUNERE PE PIAȚĂ VEHICULE FEROVIARE', 'serviciu', 'ea8641a9-ebce-4c02-8f93-8844a5506232', 0, 1, 10, '#F4E03C', 700, 1060, 80, 360, true)
ON CONFLICT (id) DO NOTHING;

-- Direcția Inspectorate de Siguranță Feroviară
INSERT INTO organizational_units (id, version_id, stas_code, name, unit_type, parent_unit_id, order_index, leadership_count, execution_count, color, custom_x, custom_y, custom_height, custom_width, is_rotated)
VALUES ('c2800185-9269-4339-8938-ed281effc4f4', '8ee3c3ff-de57-4fc1-ba18-29897a43ae89', '2000', 'DIRECȚIA INSPECTORATE DE SIGURANȚĂ FEROVIARĂ ȘI CERTIFICARE PERSONAL', 'directie', 'a160ee41-55b9-4dbc-8f4d-1513b2e74c63', 0, 1, 0, '#8CB4D4-full', 1040, 780, 100, 760, false)
ON CONFLICT (id) DO NOTHING;

-- Compartiment ISF București
INSERT INTO organizational_units (id, version_id, stas_code, name, unit_type, parent_unit_id, order_index, leadership_count, execution_count, color, custom_x, custom_y, custom_height, custom_width, is_rotated)
VALUES ('9f8fbe1c-97aa-4baf-8b5e-e407f0a7c951', '8ee3c3ff-de57-4fc1-ba18-29897a43ae89', '2001', 'COMPARTIMENT INSPECTORATUL DE SIGURANȚĂ FEROVIARĂ BUCUREȘTI', 'compartiment', 'c2800185-9269-4339-8938-ed281effc4f4', 0, 0, 2, '#8CB4D4', 900, 1380, 80, 320, true)
ON CONFLICT (id) DO NOTHING;

-- ISF Craiova
INSERT INTO organizational_units (id, version_id, stas_code, name, unit_type, parent_unit_id, order_index, leadership_count, execution_count, color, custom_x, custom_y, custom_height, custom_width, is_rotated)
VALUES ('97c64399-01db-442e-aa06-62a78b09e5f9', '8ee3c3ff-de57-4fc1-ba18-29897a43ae89', '2010', 'INSPECTORATUL DE SIGURANȚĂ FEROVIARĂ CRAIOVA', 'inspectorat', 'c2800185-9269-4339-8938-ed281effc4f4', 0, 1, 12, '#8CB4D4', 1000, 1040, 80, 320, true)
ON CONFLICT (id) DO NOTHING;

-- ISF Timișoara
INSERT INTO organizational_units (id, version_id, stas_code, name, unit_type, parent_unit_id, order_index, leadership_count, execution_count, color, custom_x, custom_y, custom_height, custom_width, is_rotated)
VALUES ('c449cfa5-7d90-4492-b997-f2a4afc11b3f', '8ee3c3ff-de57-4fc1-ba18-29897a43ae89', '2020', 'INSPECTORATUL DE SIGURANȚĂ FEROVIARĂ TIMIȘOARA', 'inspectorat', 'c2800185-9269-4339-8938-ed281effc4f4', 0, 1, 13, '#8CB4D4', 1120, 1040, 80, 320, true)
ON CONFLICT (id) DO NOTHING;

-- ISF Cluj
INSERT INTO organizational_units (id, version_id, stas_code, name, unit_type, parent_unit_id, order_index, leadership_count, execution_count, color, custom_x, custom_y, custom_height, custom_width, is_rotated)
VALUES ('3a36a479-b6df-4dbf-a7c4-3058661352cc', '8ee3c3ff-de57-4fc1-ba18-29897a43ae89', '2030', 'INSPECTORATUL DE SIGURANȚĂ FEROVIARĂ CLUJ', 'inspectorat', 'c2800185-9269-4339-8938-ed281effc4f4', 0, 1, 10, '#8CB4D4', 1240, 1040, 80, 320, true)
ON CONFLICT (id) DO NOTHING;

-- Compartiment ISF Brașov
INSERT INTO organizational_units (id, version_id, stas_code, name, unit_type, parent_unit_id, order_index, leadership_count, execution_count, color, custom_x, custom_y, custom_height, custom_width, is_rotated)
VALUES ('a1698231-1c70-4933-bd41-fcaf74faf0e9', '8ee3c3ff-de57-4fc1-ba18-29897a43ae89', '2031', 'COMPARTIMENT INSPECTORATUL DE SIGURANȚĂ FEROVIARĂ BRAȘOV', 'compartiment', '3a36a479-b6df-4dbf-a7c4-3058661352cc', 0, 0, 8, '#8CB4D4', 1240, 1380, 80, 320, true)
ON CONFLICT (id) DO NOTHING;

-- ISF Iași
INSERT INTO organizational_units (id, version_id, stas_code, name, unit_type, parent_unit_id, order_index, leadership_count, execution_count, color, custom_x, custom_y, custom_height, custom_width, is_rotated)
VALUES ('118ad10a-f9df-4b27-8c0a-a71baf879dd0', '8ee3c3ff-de57-4fc1-ba18-29897a43ae89', '2040', 'INSPECTORATUL DE SIGURANȚĂ FEROVIARĂ IAȘI', 'inspectorat', 'c2800185-9269-4339-8938-ed281effc4f4', 0, 1, 10, '#8CB4D4', 1360, 1040, 80, 320, true)
ON CONFLICT (id) DO NOTHING;

-- Compartiment ISF Galați
INSERT INTO organizational_units (id, version_id, stas_code, name, unit_type, parent_unit_id, order_index, leadership_count, execution_count, color, custom_x, custom_y, custom_height, custom_width, is_rotated)
VALUES ('d1571827-062d-49cc-8205-e8b6f5b675d6', '8ee3c3ff-de57-4fc1-ba18-29897a43ae89', '2041', 'COMPARTIMENT INSPECTORATUL DE SIGURANȚĂ FEROVIARĂ GALAȚI', 'compartiment', '118ad10a-f9df-4b27-8c0a-a71baf879dd0', 0, 0, 9, '#8CB4D4', 1360, 1380, 80, 320, true)
ON CONFLICT (id) DO NOTHING;

-- ISF Constanța
INSERT INTO organizational_units (id, version_id, stas_code, name, unit_type, parent_unit_id, order_index, leadership_count, execution_count, color, custom_x, custom_y, custom_height, custom_width, is_rotated)
VALUES ('78b2c54c-0cbe-48f0-90c1-74d8ba73d6a5', '8ee3c3ff-de57-4fc1-ba18-29897a43ae89', '2050', 'INSPECTORATUL DE SIGURANȚĂ FEROVIARĂ CONSTANȚA', 'inspectorat', 'c2800185-9269-4339-8938-ed281effc4f4', 0, 1, 10, '#8CB4D4', 1480, 1040, 80, 320, true)
ON CONFLICT (id) DO NOTHING;

-- Serviciul Certificare Mecanici
INSERT INTO organizational_units (id, version_id, stas_code, name, unit_type, parent_unit_id, order_index, leadership_count, execution_count, color, custom_x, custom_y, custom_height, custom_width, is_rotated)
VALUES ('ce135c38-d2cc-4927-beb9-12ca7ccd3f97', '8ee3c3ff-de57-4fc1-ba18-29897a43ae89', '2060', 'SERVICIUL CERTIFICARE MECANICI DE LOCOMOTIVĂ, AUTORIZARE/ATESTARE PERSONAL', 'serviciu', 'c2800185-9269-4339-8938-ed281effc4f4', 0, 1, 10, '#8CB4D4', 1600, 1040, 80, 320, true)
ON CONFLICT (id) DO NOTHING;

-- Direcția Licențiere Feroviară
INSERT INTO organizational_units (id, version_id, stas_code, name, unit_type, parent_unit_id, order_index, leadership_count, execution_count, color, custom_x, custom_y, custom_height, custom_width, is_rotated)
VALUES ('8ae83804-2ad3-4649-a813-34a412cedaeb', '8ee3c3ff-de57-4fc1-ba18-29897a43ae89', '3000', 'DIRECȚIA LICENȚIERE FEROVIARĂ, AUTORIZARE DE SIGURANȚĂ ȘI EVALUARE INDEPENDENTĂ', 'directie', 'a160ee41-55b9-4dbc-8f4d-1513b2e74c63', 0, 1, 0, '#F4A43C-full', 1920, 780, 100, 460, false)
ON CONFLICT (id) DO NOTHING;

-- Compartiment Licențe Feroviare
INSERT INTO organizational_units (id, version_id, stas_code, name, unit_type, parent_unit_id, order_index, leadership_count, execution_count, color, custom_x, custom_y, custom_height, custom_width, is_rotated)
VALUES ('ab2f90e0-1ae8-45c4-853f-fb9b5c57b8f5', '8ee3c3ff-de57-4fc1-ba18-29897a43ae89', '3001', 'COMPARTIMENT LICENȚE FEROVIARE', 'compartiment', '8ae83804-2ad3-4649-a813-34a412cedaeb', 0, 0, 9, '#F4A43C', 1900, 1300, 80, 280, true)
ON CONFLICT (id) DO NOTHING;

-- Compartiment Evaluare Sistem Management Risc
INSERT INTO organizational_units (id, version_id, stas_code, name, unit_type, parent_unit_id, order_index, leadership_count, execution_count, color, custom_x, custom_y, custom_height, custom_width, is_rotated)
VALUES ('2fb34ab5-a18b-4396-9869-8f3bfecefff1', '8ee3c3ff-de57-4fc1-ba18-29897a43ae89', '3002', 'COMPARTIMENT EVALUARE SISTEM MANAGEMENT RISC', 'compartiment', '8ae83804-2ad3-4649-a813-34a412cedaeb', 0, 0, 5, '#F4A43C', 2000, 1300, 80, 280, true)
ON CONFLICT (id) DO NOTHING;

-- Compartiment Autorizare de Siguranță
INSERT INTO organizational_units (id, version_id, stas_code, name, unit_type, parent_unit_id, order_index, leadership_count, execution_count, color, custom_x, custom_y, custom_height, custom_width, is_rotated)
VALUES ('0daa4235-ba45-49c6-ba52-22bc888aa850', '8ee3c3ff-de57-4fc1-ba18-29897a43ae89', '3003', 'COMPARTIMENT AUTORIZARE DE SIGURANȚĂ / AUTORIZARE DE PUNERE ÎN FUNCȚIUNE', 'compartiment', '8ae83804-2ad3-4649-a813-34a412cedaeb', 0, 0, 4, '#F4A43C', 2100, 1300, 80, 280, true)
ON CONFLICT (id) DO NOTHING;

-- Compartiment Linii Ferate Industriale
INSERT INTO organizational_units (id, version_id, stas_code, name, unit_type, parent_unit_id, order_index, leadership_count, execution_count, color, custom_x, custom_y, custom_height, custom_width, is_rotated)
VALUES ('34222070-2c23-4b91-be93-8b9293e86ba3', '8ee3c3ff-de57-4fc1-ba18-29897a43ae89', '3004', 'COMPARTIMENT LINII FERATE INDUSTRIALE', 'compartiment', '8ae83804-2ad3-4649-a813-34a412cedaeb', 0, 0, 8, '#F4A43C', 2200, 1300, 80, 280, true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- UTILIZATORI
-- ============================================================================

INSERT INTO users (id, email, hashed_password, role, active, created_at, full_name)
VALUES
    ('5f31d2fb-a708-41ad-987c-3b93b320182a', 'georgiana.ghimes@sigurantaferoviara.ro', '$pbkdf2-sha256$29000$zRljDIFwTolxbk3JWcv5vw$.Z8idljYoYDD.Gn6FC6DazCTIEF42Cg0TxCAn0rfFPw', 'admin', true, '2026-02-24 08:00:52.410301', 'Georgiana Ghimeș'),
    ('625f5e4b-6a33-4991-bbf3-a952ea4e40d2', 'bogdan.petru@sigurantaferoviara.ro', '$pbkdf2-sha256$29000$hfD.X6vV2vs/ByAkJIQwBg$Wh6XLQ4.KMSg7WmPEsR8e3DpV/e3j6c.LpGeHIuQ9Ic', 'admin', true, '2026-02-24 11:45:24.329515', 'Petru Bogdan')
ON CONFLICT (id) DO NOTHING;