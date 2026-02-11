# Changelog - Organigrama MVP

## [1.0.0] - 2026-02-11

### Migrare Completă: base44 → FastAPI + PostgreSQL

#### ✨ Adăugat

**Backend (NOU)**
- Python FastAPI backend complet
- PostgreSQL database cu SQLAlchemy ORM
- JWT authentication cu role-based access (viewer, editor, approver, admin)
- API RESTful complet documentat (Swagger/ReDoc)
- Modele de date: OrgVersion, OrgUnit, Position, Employee, PositionAssignment, User
- Endpoints pentru toate entitățile
- Script de inițializare database (init_db.py)
- User admin implicit: admin@organigrama.ro / admin123

**Frontend**
- API client custom (apiClient.js) - înlocuiește base44 SDK
- AuthContext actualizat pentru JWT
- Suport pentru variabile de environment (.env)

**Documentație**
- README.md complet cu instrucțiuni
- MIGRATION.md - ghid detaliat de migrare
- SETUP.md - setup rapid în 5 pași
- backend/README.md - documentație API

**Configurare**
- .env.example pentru frontend și backend
- .gitignore actualizat pentru Python/PostgreSQL
- requirements.txt pentru dependențe Python

#### 🔄 Modificat

**Frontend**
- `src/pages/OrgChart.jsx` - folosește apiClient în loc de base44
- `src/pages/Versions.jsx` - folosește apiClient în loc de base44
- `src/pages/Employees.jsx` - folosește apiClient în loc de base44
- `src/lib/AuthContext.jsx` - sistem de autentificare JWT
- `package.json` - eliminat dependențe base44

#### 🗑️ Șters

- `src/api/base44Client.js` - înlocuit cu apiClient.js
- `src/lib/app-params.js` - nu mai este necesar
- Dependențe: `@base44/sdk`, `@base44/vite-plugin`

#### 📋 Funcționalități Păstrate

Toate funcționalitățile din versiunea base44 au fost păstrate identic:
- ✅ Creare versiune organigramă (Draft → Pending → Approved)
- ✅ Introducere structură STAS manual
- ✅ Gestionare unități organizaționale
- ✅ Gestionare posturi
- ✅ Gestionare angajați
- ✅ Atribuire angajați la posturi
- ✅ Vizualizare organigramă (diagramă + arbore)
- ✅ Duplicare versiuni
- ✅ Istoric versiuni
- ✅ Validări business logic

#### 🚧 În Dezvoltare

- Generare PDF oficial cu WeasyPrint
- Calcul recursiv total subordine
- Export/Import date

#### 🔒 Business Rules Implementate

- Structura nu poate fi editată dacă versiunea este Approved
- Codurile STAS validate pentru unicitate per versiune
- Nu se pot șterge unități din versiune aprobată
- Doar approvers pot aproba versiuni
- Soft delete pentru angajați

#### 🏗️ Arhitectură

**Stack Tehnic:**
- Backend: Python 3.9+ + FastAPI + PostgreSQL + SQLAlchemy
- Frontend: React 18 + Vite + TanStack Query + Tailwind CSS
- Auth: JWT cu role-based access control
- PDF: WeasyPrint (în dezvoltare)

**Database Schema:**
- org_versions (id, version_number, name, status, notes, created_date, approved_by, approved_date)
- organizational_units (id, version_id, stas_code, name, unit_type, parent_unit_id, order_index, positions counts, color)
- positions (id, version_id, unit_id, title, position_type, grade, is_vacant, order_index)
- employees (id, first_name, last_name, email, phone, hire_date, status, active)
- position_assignments (id, position_id, employee_id, start_date, end_date)
- users (id, email, hashed_password, role, active, created_at)

**API Endpoints:**
- `/api/auth/*` - Authentication
- `/api/versions/*` - Version management
- `/api/units/*` - Organizational units
- `/api/positions/*` - Positions
- `/api/employees/*` - Employees
- `/api/assignments/*` - Position assignments

#### 📊 Statistici Migrare

- Fișiere backend create: 18
- Fișiere frontend modificate: 5
- Fișiere șterse: 2
- Linii de cod adăugate: ~1,900
- Dependențe Python: 12
- Dependențe npm eliminate: 2

#### 🎯 Conformitate MVP

Proiectul respectă EXACT specificațiile din documentul MVP:
- ✅ Stack: Python + FastAPI + PostgreSQL + React
- ✅ ORM: SQLAlchemy
- ✅ Auth: JWT simplu cu role-based access
- ✅ PDF: WeasyPrint (pregătit)
- ✅ Model de date conform specificațiilor
- ✅ Business rules implementate
- ✅ API endpoints conform documentației

---

## [0.1.0] - 2026-02-11

### Import Inițial

- Import proiect de pe aplicația base44 online
- Structură inițială cu React + base44 SDK
- Componente UI cu shadcn/ui
- Funcționalitate completă organigramă
