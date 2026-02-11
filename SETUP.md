# Setup Rapid - Organigrama MVP

## Prerequisite

- Python 3.9+
- PostgreSQL 12+
- Node.js 18+
- npm sau yarn

## Setup în 5 Pași

### 1. Clonează și Instalează

```bash
# Clonează repository-ul
git clone <repo-url>
cd ASFR_Generator_Organigrama
```

### 2. Setup PostgreSQL

```bash
# Creează database
createdb organigrama

# SAU din psql:
psql -U postgres
CREATE DATABASE organigrama;
\q
```

### 3. Setup Backend

```bash
cd backend

# Creează virtual environment (opțional dar recomandat)
python -m venv venv
source venv/bin/activate  # Linux/Mac
# SAU
venv\Scripts\activate     # Windows

# Instalează dependențe
pip install -r requirements.txt

# Configurează environment
cp .env.example .env
# Editează .env cu credențialele tale PostgreSQL

# Inițializează database
python init_db.py

# Pornește serverul
uvicorn app.main:app --reload --port 8000
```

Backend va rula pe: `http://localhost:8000`
API Docs: `http://localhost:8000/docs`

### 4. Setup Frontend

```bash
# În alt terminal, din root folder
npm install

# Configurează API URL
cp .env.example .env
# Default: VITE_API_URL=http://localhost:8000/api

# Pornește dev server
npm run dev
```

Frontend va rula pe: `http://localhost:5173`

### 5. Login

Deschide browser la `http://localhost:5173` și login cu:
- Email: `admin@organigrama.ro`
- Password: `admin123`

## Verificare Setup

### Backend Health Check
```bash
curl http://localhost:8000/health
# Răspuns: {"status":"ok"}
```

### Database Check
```bash
psql -U postgres -d organigrama -c "\dt"
# Ar trebui să vezi tabelele: users, org_versions, organizational_units, etc.
```

### Frontend Check
```bash
curl http://localhost:5173
# Ar trebui să returneze HTML
```

## Troubleshooting

### Eroare: "database organigrama does not exist"
```bash
createdb organigrama
```

### Eroare: "psycopg2 not found"
```bash
pip install psycopg2-binary
```

### Eroare: "Port 8000 already in use"
```bash
# Schimbă portul
uvicorn app.main:app --reload --port 8001

# Și actualizează .env în frontend
VITE_API_URL=http://localhost:8001/api
```

### Eroare: "Cannot connect to API"
- Verifică că backend-ul rulează pe portul corect
- Verifică VITE_API_URL în .env
- Verifică CORS settings în backend/app/main.py

### Eroare: "Module not found"
```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend
npm install
```

## Comenzi Utile

### Backend
```bash
# Rulează server
uvicorn app.main:app --reload

# Rulează cu log detaliat
uvicorn app.main:app --reload --log-level debug

# Resetează database
python init_db.py
```

### Frontend
```bash
# Dev server
npm run dev

# Build pentru producție
npm run build

# Preview build
npm run preview

# Lint
npm run lint
```

### Database
```bash
# Conectare la database
psql -U postgres -d organigrama

# Backup
pg_dump -U postgres organigrama > backup.sql

# Restore
psql -U postgres organigrama < backup.sql

# Drop și recreează
dropdb organigrama
createdb organigrama
cd backend && python init_db.py
```

## Next Steps

După setup, poți:

1. Creează utilizatori noi prin API:
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass123","role":"editor"}'
```

2. Explorează API documentation:
   - Swagger UI: http://localhost:8000/docs
   - ReDoc: http://localhost:8000/redoc

3. Creează prima versiune de organigramă din UI

4. Citește MIGRATION.md pentru detalii despre arhitectură

## Producție

Pentru deployment în producție, vezi:
- Backend: Folosește Gunicorn + Uvicorn workers
- Frontend: Build cu `npm run build` și servește cu Nginx
- Database: Configurează backup automat
- Security: Schimbă SECRET_KEY în .env
