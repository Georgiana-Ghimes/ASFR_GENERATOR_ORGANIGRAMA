-- ============================================================================
-- ASFR Generator Organigramă — Seed: versiunea curentă cu toate unitățile
-- Migrare: 001_seed_current_data.sql
-- Conține: versiunea 49/23.01.2026 cu 37 unități organizatorice
-- ============================================================================

--
-- PostgreSQL database dump
--

-- \restrict removed for compatibility

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: org_versions; Type: TABLE DATA; Schema: public; Owner: -
--

SET SESSION AUTHORIZATION DEFAULT;

ALTER TABLE public.org_versions DISABLE TRIGGER ALL;

INSERT INTO public.org_versions VALUES ('8ee3c3ff-de57-4fc1-ba18-29897a43ae89', '49/23.01.2026', 'CODIFICAREA STRUCTURILOR DIN ANEXA LA OMTI NR. 49/23.01.2026', 'draft', NULL, '2026-03-02 12:46:21.505751', NULL, NULL, NULL, 'CODIFICAREA STRUCTURILOR DIN ANEXA LA OMTI NR. 49/23.01.2026', 'codificare', NULL, NULL, NULL, NULL, NULL);


ALTER TABLE public.org_versions ENABLE TRIGGER ALL;

--
-- Data for Name: organizational_units; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.organizational_units DISABLE TRIGGER ALL;

INSERT INTO public.organizational_units VALUES ('2283ae2b-1abd-452e-ad5f-1a46bebd26fe', '8ee3c3ff-de57-4fc1-ba18-29897a43ae89', '2000', 'DIRECȚIA INSPECTORATE DE SIGURANȚĂ FEROVIARĂ ȘI CERTIFICARE PERSONAL', 'directie', '79d938b2-cbc4-457b-8632-ec7480fb26f4', 0, 1, 0, '#8CB4D4-full', 1040, 780, 100, 760, '', '', '', '', '', false);
INSERT INTO public.organizational_units VALUES ('c00534eb-3066-4d6f-b8ac-7271b76cd31d', '8ee3c3ff-de57-4fc1-ba18-29897a43ae89', '1100', 'DIRECȚIA ECONOMICĂ', 'directie', '79d938b2-cbc4-457b-8632-ec7480fb26f4', 0, 1, 14, '#E8B4D4-full', 160, 780, 100, 420, '', '', '', '', '', false);
INSERT INTO public.organizational_units VALUES ('46ceca9e-f908-4b08-96a0-9d2c7bc734de', '8ee3c3ff-de57-4fc1-ba18-29897a43ae89', '2001', 'COMPARTIMENT INSPECTORATUL DE SIGURANȚĂ FEROVIARĂ BUCUREȘTI', 'compartiment', '2283ae2b-1abd-452e-ad5f-1a46bebd26fe', 0, 0, 2, '#8CB4D4', 900, 1380, 80, 320, '', '', '', '', '', true);
INSERT INTO public.organizational_units VALUES ('3a11938e-d279-4e49-9657-65f4276f60d5', '8ee3c3ff-de57-4fc1-ba18-29897a43ae89', '1010', 'SERVICIUL JURIDIC', 'serviciu', '79d938b2-cbc4-457b-8632-ec7480fb26f4', 0, 1, 3, '#86C67C', 1420, 360, 60, 320, '', '', '', '', '', false);
INSERT INTO public.organizational_units VALUES ('898ee510-2935-4fba-8c29-9801a27f4056', '8ee3c3ff-de57-4fc1-ba18-29897a43ae89', '1120', 'SERVICIUL TEHNIC ADMINISTRATIV ACHIZIȚII', '', 'c00534eb-3066-4d6f-b8ac-7271b76cd31d', 0, 1, 3, '#E8B4D4', 20, 1060, 80, 360, '', '', '', '', '', true);
INSERT INTO public.organizational_units VALUES ('0a79a865-5945-447d-8435-4dd22a51ef9b', '8ee3c3ff-de57-4fc1-ba18-29897a43ae89', '1001', 'CONSILIERI DIRECTOR GENERAL', 'consilieri', '79d938b2-cbc4-457b-8632-ec7480fb26f4', 0, 0, 2, '#86C67C', 300, 200, 60, 320, '', '', '', '', '', false);
INSERT INTO public.organizational_units VALUES ('b76fb098-6a41-4f21-8071-bda7448ab089', '8ee3c3ff-de57-4fc1-ba18-29897a43ae89', '1101', 'COMPARTIMENT CONTROL FINANCIAR PREVENTIV', 'compartiment', 'c00534eb-3066-4d6f-b8ac-7271b76cd31d', 0, 0, 2, '#E8B4D4', 200, 1420, 80, 340, '', '', '', '', '', true);
INSERT INTO public.organizational_units VALUES ('97c64399-01db-442e-aa06-62a78b09e5f9', '8ee3c3ff-de57-4fc1-ba18-29897a43ae89', '2010', 'INSPECTORATUL DE SIGURANȚĂ FEROVIARĂ CRAIOVA', 'inspectorat', '2283ae2b-1abd-452e-ad5f-1a46bebd26fe', 0, 1, 12, '#8CB4D4', 1000, 1040, 80, 320, '', '', '', '', '', true);
INSERT INTO public.organizational_units VALUES ('0bd4820b-5ed2-4583-8026-9a6b79fc343e', '8ee3c3ff-de57-4fc1-ba18-29897a43ae89', '1102', 'COMPARTIMENT FINANCIAR SALARII ȘI BUGET', 'compartiment', 'c00534eb-3066-4d6f-b8ac-7271b76cd31d', 0, 0, 6, '#E8B4D4', 300, 1420, 80, 340, '', '', '', '', '', true);
INSERT INTO public.organizational_units VALUES ('26ddc60b-e3f0-4a21-a9a6-ca9c323e9ebe', '8ee3c3ff-de57-4fc1-ba18-29897a43ae89', '1103', 'COMPARTIMENT CONTABILITATE, FACTURARE, CASIERIE', 'compartiment', 'c00534eb-3066-4d6f-b8ac-7271b76cd31d', 0, 0, 6, '#E8B4D4', 400, 1420, 80, 340, '', '', '', '', '', true);
INSERT INTO public.organizational_units VALUES ('2e9979b1-4956-4484-a9f2-86d4b42a71fa', '8ee3c3ff-de57-4fc1-ba18-29897a43ae89', '1200', 'DEPARTAMENT CERTIFICARE ERI', 'departament', '79d938b2-cbc4-457b-8632-ec7480fb26f4', 0, 1, 0, '#F4E03C-full', 620, 780, 100, 380, '', '', '', '', '', false);
INSERT INTO public.organizational_units VALUES ('cd388337-1dc7-445a-9ecf-ffd716976b79', '8ee3c3ff-de57-4fc1-ba18-29897a43ae89', '1210', 'SERVICIUL CERTIFICARE ENTITĂȚI RESPONSABILE CU ÎNTREȚINEREA VEHICULELOR FEROVIARE', 'serviciu', '2e9979b1-4956-4484-a9f2-86d4b42a71fa', 0, 1, 10, '#F4E03C', 560, 1060, 80, 360, '', '', '', '', '', true);
INSERT INTO public.organizational_units VALUES ('8e7de0b9-b839-492d-9517-d8ca51b9a567', '8ee3c3ff-de57-4fc1-ba18-29897a43ae89', '1220', 'SERVICIUL CERTIFICARE ERI FUNCȚII ÎNTREȚINERE, AUTORIZARE PUNERE PE PIAȚĂ VEHICULE FEROVIARE', 'serviciu', '2e9979b1-4956-4484-a9f2-86d4b42a71fa', 0, 1, 10, '#F4E03C', 700, 1060, 80, 360, '', '', '', '', '', true);
INSERT INTO public.organizational_units VALUES ('6446a95f-8d83-4c37-bfc3-680183cddd51', '8ee3c3ff-de57-4fc1-ba18-29897a43ae89', '2020', 'INSPECTORATUL DE SIGURANȚĂ FEROVIARĂ TIMIȘOARA', 'inspectorat', '2283ae2b-1abd-452e-ad5f-1a46bebd26fe', 0, 1, 13, '#8CB4D4', 1120, 1040, 80, 320, '', '', '', '', '', true);
INSERT INTO public.organizational_units VALUES ('0b6c6fa4-43bd-4a0b-8fc3-c56141a727ef', '8ee3c3ff-de57-4fc1-ba18-29897a43ae89', '2030', 'INSPECTORATUL DE SIGURANȚĂ FEROVIARĂ CLUJ', 'inspectorat', '2283ae2b-1abd-452e-ad5f-1a46bebd26fe', 0, 1, 10, '#8CB4D4', 1240, 1040, 80, 320, '', '', '', '', '', true);
INSERT INTO public.organizational_units VALUES ('1e9f4f7f-bc42-411e-8eb3-15da2be32cf0', '8ee3c3ff-de57-4fc1-ba18-29897a43ae89', '2031', 'COMPARTIMENT INSPECTORATUL DE SIGURANȚĂ FEROVIARĂ BRAȘOV', 'compartiment', '0b6c6fa4-43bd-4a0b-8fc3-c56141a727ef', 0, 0, 8, '#8CB4D4', 1240, 1380, 80, 320, '', '', '', '', '', true);
INSERT INTO public.organizational_units VALUES ('79d938b2-cbc4-457b-8632-ec7480fb26f4', '8ee3c3ff-de57-4fc1-ba18-29897a43ae89', '1000', 'DIRECTOR GENERAL', 'director_general', NULL, 0, 1, 0, '#86C67C-full', 1000, 200, 60, 380, 'DIRECTOR GENERAL', 'Petru BOGDAN', NULL, NULL, NULL, false);
INSERT INTO public.organizational_units VALUES ('e3650618-9a54-4b8d-b938-494ba0804037', '8ee3c3ff-de57-4fc1-ba18-29897a43ae89', '1002', 'COMPARTIMENT AUDIT INTERN', 'compartiment', '79d938b2-cbc4-457b-8632-ec7480fb26f4', 0, 0, 3, '#86C67C', 300, 280, 60, 320, '', '', '', '', '', false);
INSERT INTO public.organizational_units VALUES ('f512596f-d5ac-41b7-97c6-266f5e13dd85', '8ee3c3ff-de57-4fc1-ba18-29897a43ae89', '2040', 'INSPECTORATUL DE SIGURANȚĂ FEROVIARĂ IAȘI', 'inspectorat', '2283ae2b-1abd-452e-ad5f-1a46bebd26fe', 0, 1, 10, '#8CB4D4', 1360, 1040, 80, 320, '', '', '', '', '', true);
INSERT INTO public.organizational_units VALUES ('bb7ddee3-4423-4685-b5a6-28e4d882d00c', '8ee3c3ff-de57-4fc1-ba18-29897a43ae89', '1021', 'COMPARTIMENT REGISTRATURĂ, ARHIVĂ', 'compartiment', '92e8bb89-5981-438a-9ae7-a7d1a3e509a9', 0, 0, 3, '#86C67C', 1800, 200, 60, 380, '', '', '', '', '', false);
INSERT INTO public.organizational_units VALUES ('f2f7fc19-c6d2-43ea-957c-1cfb5f0ff4fe', '8ee3c3ff-de57-4fc1-ba18-29897a43ae89', '1022', 'COMPARTIMENT SSM, SU', 'compartiment', '92e8bb89-5981-438a-9ae7-a7d1a3e509a9', 0, 0, 2, '#86C67C', 1800, 280, 60, 380, '', '', '', '', '', false);
INSERT INTO public.organizational_units VALUES ('731a61d1-c814-49c9-9a32-5bd2321b221c', '8ee3c3ff-de57-4fc1-ba18-29897a43ae89', '1011', 'COMPARTIMENT REGLEMENTĂRI DE SIGURANȚĂ FEROVIARĂ', 'compartiment', '3a11938e-d279-4e49-9657-65f4276f60d5', 0, 0, 4, '#86C67C', 1800, 360, 60, 380, '', '', '', '', '', false);
INSERT INTO public.organizational_units VALUES ('8d49659a-9271-4c2d-8c29-1714161d19a4', '8ee3c3ff-de57-4fc1-ba18-29897a43ae89', '1040', 'SERVICIUL CONTROL ȘI SIGURANȚA CIRCULAȚIEI', 'serviciu', '79d938b2-cbc4-457b-8632-ec7480fb26f4', 0, 1, 10, '#86C67C', 1420, 520, 60, 320, '', '', '', '', '', false);
INSERT INTO public.organizational_units VALUES ('92e8bb89-5981-438a-9ae7-a7d1a3e509a9', '8ee3c3ff-de57-4fc1-ba18-29897a43ae89', '1020', 'SERVICIUL RESURSE UMANE', 'serviciu', '79d938b2-cbc4-457b-8632-ec7480fb26f4', 0, 1, 5, '#86C67C', 1420, 200, 60, 320, '', '', '', '', '', false);
INSERT INTO public.organizational_units VALUES ('88e6ad15-ebc3-4ea7-8ff8-58560a6099e0', '8ee3c3ff-de57-4fc1-ba18-29897a43ae89', '1031', 'DISPECERAT 112', 'dispecerat', 'd5a427fa-315c-42cd-a460-ec4701aab871', 0, 0, 5, '#86C67C', 300, 360, 60, 320, '', '', '', '', '', false);
INSERT INTO public.organizational_units VALUES ('c3059627-99b3-47eb-a890-5b46d9b738ef', '8ee3c3ff-de57-4fc1-ba18-29897a43ae89', '3002', 'COMPARTIMENT EVALUARE SISTEM MANAGEMENT RISC', 'compartiment', 'ff58199a-b568-4587-b0d9-f3be61e95a06', 0, 0, 5, '#F4A43C', 2000, 1300, 80, 280, '', '', '', '', '', true);
INSERT INTO public.organizational_units VALUES ('d5a427fa-315c-42cd-a460-ec4701aab871', '8ee3c3ff-de57-4fc1-ba18-29897a43ae89', '1030', 'SERVICIUL COMUNICARE', 'serviciu', '79d938b2-cbc4-457b-8632-ec7480fb26f4', 0, 1, 6, '#86C67C', 660, 360, 60, 300, '', '', '', '', '', false);
INSERT INTO public.organizational_units VALUES ('e4ee6a68-8481-490f-9f03-14351d6b81fb', '8ee3c3ff-de57-4fc1-ba18-29897a43ae89', '1012', 'COMPARTIMENT DREPTURI CĂLĂTORI', 'compartiment', '3a11938e-d279-4e49-9657-65f4276f60d5', 0, 0, 3, '#86C67C', 1800, 440, 60, 380, '', '', '', '', '', false);
INSERT INTO public.organizational_units VALUES ('d1571827-062d-49cc-8205-e8b6f5b675d6', '8ee3c3ff-de57-4fc1-ba18-29897a43ae89', '2041', 'COMPARTIMENT INSPECTORATUL DE SIGURANȚĂ FEROVIARĂ GALAȚI', 'compartiment', 'f512596f-d5ac-41b7-97c6-266f5e13dd85', 0, 0, 9, '#8CB4D4', 1360, 1380, 80, 320, '', '', '', '', '', true);
INSERT INTO public.organizational_units VALUES ('55bf2b83-1269-4bb4-98b5-ed5d0ef05da0', '8ee3c3ff-de57-4fc1-ba18-29897a43ae89', '2050', 'INSPECTORATUL DE SIGURANȚĂ FEROVIARĂ CONSTANȚA', 'inspectorat', '2283ae2b-1abd-452e-ad5f-1a46bebd26fe', 0, 1, 10, '#8CB4D4', 1480, 1040, 80, 320, '', '', '', '', '', true);
INSERT INTO public.organizational_units VALUES ('85f267f7-9e32-417f-89eb-93d0c06bbe27', '8ee3c3ff-de57-4fc1-ba18-29897a43ae89', '2060', 'SERVICIUL CERTIFICARE MECANICI DE LOCOMOTIVĂ, AUTORIZARE/ATESTARE PERSONAL', 'serviciu', '2283ae2b-1abd-452e-ad5f-1a46bebd26fe', 0, 1, 10, '#8CB4D4', 1600, 1040, 80, 320, '', '', '', '', '', true);
INSERT INTO public.organizational_units VALUES ('ff58199a-b568-4587-b0d9-f3be61e95a06', '8ee3c3ff-de57-4fc1-ba18-29897a43ae89', '3000', 'DIRECȚIA LICENȚIERE FEROVIARĂ, AUTORIZARE DE SIGURANȚĂ ȘI EVALUARE INDEPENDENTĂ', 'directie', '79d938b2-cbc4-457b-8632-ec7480fb26f4', 0, 1, 0, '#F4A43C-full', 1920, 780, 100, 460, '', '', '', '', '', false);
INSERT INTO public.organizational_units VALUES ('9f1e6c4e-582f-4bda-a591-a15978f0fa40', '8ee3c3ff-de57-4fc1-ba18-29897a43ae89', '3001', 'COMPARTIMENT LICENȚE FEROVIARE', 'compartiment', 'ff58199a-b568-4587-b0d9-f3be61e95a06', 0, 0, 9, '#F4A43C', 1900, 1300, 80, 280, '', '', '', '', '', true);
INSERT INTO public.organizational_units VALUES ('46ee113c-0501-470b-b9ae-0140ba90f81e', '8ee3c3ff-de57-4fc1-ba18-29897a43ae89', '3003', 'COMPARTIMENT AUTORIZARE DE SIGURANȚĂ / AUTORIZARE DE PUNERE ÎN FUNCȚIUNE', 'compartiment', 'ff58199a-b568-4587-b0d9-f3be61e95a06', 0, 0, 4, '#F4A43C', 2100, 1300, 80, 280, '', '', '', '', '', true);
INSERT INTO public.organizational_units VALUES ('96ee2b5b-99e5-43eb-8b0c-2335a32824e7', '8ee3c3ff-de57-4fc1-ba18-29897a43ae89', '3004', 'COMPARTIMENT LINII FERATE INDUSTRIALE', 'compartiment', 'ff58199a-b568-4587-b0d9-f3be61e95a06', 0, 0, 8, '#F4A43C', 2200, 1300, 80, 280, '', '', '', '', '', true);
INSERT INTO public.organizational_units VALUES ('4946f1b0-55d7-40ed-881e-1a2b767c967f', '8ee3c3ff-de57-4fc1-ba18-29897a43ae89', '1051', 'COMPARTIMENT CERTIFICARE OTF, RECUNOAȘTERE CENTRE DE FORMARE', 'compartiment', '79d938b2-cbc4-457b-8632-ec7480fb26f4', 0, 0, 4, '#86C67C', 1800, 600, 60, 380, '', '', '', '', '', false);
INSERT INTO public.organizational_units VALUES ('dd4395d8-6802-463a-a2ca-bbdefa177a82', '8ee3c3ff-de57-4fc1-ba18-29897a43ae89', '1052', 'COMPARTIMENT CERTIFICARE OMF', 'compartiment', '79d938b2-cbc4-457b-8632-ec7480fb26f4', 0, 0, 2, '#86C67C', 1800, 680, 60, 380, '', '', '', '', '', false);


ALTER TABLE public.organizational_units ENABLE TRIGGER ALL;

--
-- Data for Name: unit_types; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.unit_types DISABLE TRIGGER ALL;

INSERT INTO public.unit_types VALUES ('26090995-38f5-4899-840e-c4b8b91201ee', 'director_general', 'Director General', 1, true, '2026-02-26 14:47:12.346677');
INSERT INTO public.unit_types VALUES ('70093191-bb4c-4484-b82a-6a85feeb39df', 'serviciu', 'Serviciu', 2, true, '2026-02-26 14:47:12.346677');
INSERT INTO public.unit_types VALUES ('36c1906b-d2b6-4b26-96b4-d92e63fc2549', 'compartiment', 'Compartiment', 3, true, '2026-02-26 14:47:12.346677');
INSERT INTO public.unit_types VALUES ('d8ee03c1-411a-4540-b4da-c78aade7e9b5', 'consilieri', 'Consilieri', 4, false, '2026-02-26 14:47:12.346677');
INSERT INTO public.unit_types VALUES ('c018053f-fadb-413f-a37d-a9e949a28c3f', 'dispecerat', 'Dispecerat', 5, false, '2026-02-26 14:47:12.346677');
INSERT INTO public.unit_types VALUES ('73664f79-e063-44a5-867a-afc4fbcab8cd', 'departament', 'Departament', 6, false, '2026-02-26 14:47:12.346677');
INSERT INTO public.unit_types VALUES ('0cd18476-7971-4b7f-a636-ebb5ef9b3de1', 'directie', 'Direcție', 7, false, '2026-02-26 14:47:12.346677');
INSERT INTO public.unit_types VALUES ('68907a0e-8975-4227-ab90-6d0636f381c0', 'inspectorat', 'Inspectorat', 8, false, '2026-02-26 14:47:12.346677');
INSERT INTO public.unit_types VALUES ('3ec3b447-591c-485d-9d2d-c570e1bb9d8b', 'consiliu', 'Consiliu de Conducere', 99, true, '2026-02-26 14:47:12.346677');
INSERT INTO public.unit_types VALUES ('c728547d-bca4-46ee-9054-62cf28225ed9', 'legend', 'Legendă', 100, true, '2026-02-26 14:47:12.346677');


ALTER TABLE public.unit_types ENABLE TRIGGER ALL;

--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

ALTER TABLE public.users DISABLE TRIGGER ALL;

INSERT INTO public.users VALUES ('5f31d2fb-a708-41ad-987c-3b93b320182a', 'georgiana.ghimes@sigurantaferoviara.ro', '$pbkdf2-sha256$29000$zRljDIFwTolxbk3JWcv5vw$.Z8idljYoYDD.Gn6FC6DazCTIEF42Cg0TxCAn0rfFPw', 'admin', true, '2026-02-24 08:00:52.410301', 'Georgiana Ghimeș');
INSERT INTO public.users VALUES ('625f5e4b-6a33-4991-bbf3-a952ea4e40d2', 'bogdan.petru@sigurantaferoviara.ro', '$pbkdf2-sha256$29000$hfD.X6vV2vs/ByAkJIQwBg$Wh6XLQ4.KMSg7WmPEsR8e3DpV/e3j6c.LpGeHIuQ9Ic', 'admin', true, '2026-02-24 11:45:24.329515', 'Petru Bogdan');


ALTER TABLE public.users ENABLE TRIGGER ALL;

--
-- PostgreSQL database dump complete
--

\unrestrict dAX1hSipOq7BtwTKbKljAdyjCs40UMjcqmRhYwz67E1wleQ54SaFpehpgxagWNM

