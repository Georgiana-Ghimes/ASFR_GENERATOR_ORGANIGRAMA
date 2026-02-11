# Ghid de Migrare - base44 → FastAPI + PostgreSQL

## Modificări Principale

### 1. Backend - Complet Nou

Am creat un backend FastAPI complet nou care înlocuiește base44:

**Structură:**
```
backend/
├── app/
│   ├── main.py           # FastAPI app
│   ├── database.py       # PostgreSQL connection
│   ├── models.py         # SQLAlchemy models
│   ├── schemas.py        # Pydantic schemas
│   ├── auth.py           # JWT authentication
│   └── api/
│       ├── auth.py       # Auth endpoints
│       ├── versions.py   # Version management
│       ├── units.py      # Organizational units
│       ├── positions.py  # Positions
│       ├── employees.py  # Employees
│       └── assignments.py # Position assignments
├── requirements.txt
├── init_db.py           # Database initialization
└── .env.example
```

**Modele de Date:**
- `OrgVersion` - Versiuni organigramă
- `OrgUnit` - Unități organizaționale
- `Position` - Posturi
- `Employee` - Angajați
- `PositionAssignment` - Atribuiri angajați-posturi
- `User` - Utilizatori sistem

### 2. Frontend - Actualizat

**Fișiere Modificate:**
- `src/api/apiClient.js` - NOU: Client API custom (înlocuiește base44 SDK)
- `src/lib/AuthContext.jsx` - Actualizat pentru noul sistem de autentificare
- `src/pages/OrgChart.jsx` - Actualizat să folosească apiClient
- `src/pages/Versions.jsx` - Actualizat să folosească apiClient
- `src/pages/Employees.jsx` - Actualizat să folosească apiClient

**Fișiere Șterse:**
- `src/api/base44Client.js` - Nu mai este necesar
- `src/lib/app-params.js` - Nu mai este necesar

**Dependențe Eliminate:**
- `@base44/sdk`
- `@base44/vite-plugin`

### 3. Mapare API

| base44 | FastAPI |
|--------|---------|
| `base44.entities.OrgVersion.list()` | `apiClient.listVersions()` |
| `base44.entities.OrgVersion.create(data)` | `apiClient.createVersion(data)` |
| `base44.entities.OrgVersion.update(id, data)` | `apiClient.updateVersion(id, data)` |
| `base44.entities.OrgUnit.filter({version_id})` | `apiClient.listUnits(versionId)` |
| `base44.entities.OrgUnit.create(data)` | `apiClient.createUnit(data)` |
| `base44.entities.Employee.list()` | `apiClient.listEmployees()` |
| `base44.auth.me()` | `apiClient.me()` |

### 4. Autentificare

**base44:**
- Autentificare automată prin SDK
- Token gestionat intern

**FastAPI:**
- Login explicit: `POST /api/auth/login`
- JWT token stocat în localStorage
- Header: `Authorization: Bearer <token>`

### 5. Configurare

**Înainte (base44):**
```javascript
// vite.config.js
import { base44 } from '@base44/vite-plugin';
```

**Acum (FastAPI):**
```bash
# .env
VITE_API_URL=http://localhost:8000/api
```

## Pași de Migrare

### 1. Setup Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Editează .env cu credențialele PostgreSQL
python init_db.py
uvicorn app.main:app --reload --port 8000
```

### 2. Setup Frontend

```bash
npm install
cp .env.example .env
npm run dev
```

### 3. Login Inițial

Folosește credențialele admin create automat:
- Email: `admin@organigrama.ro`
- Password: `admin123`

## Diferențe Funcționale

### Păstrate Identic:
- ✅ Toate funcționalitățile UI
- ✅ Fluxul de lucru (Draft → Pending → Approved)
- ✅ Structura de date
- ✅ Validări business logic
- ✅ Componente React

### Îmbunătățiri:
- ✅ Control complet asupra backend-ului
- ✅ Queries SQL optimizate
- ✅ Validare strictă cu Pydantic
- ✅ Documentație API automată (Swagger)
- ✅ Sistem de roluri mai granular
- ✅ Pregătit pentru integrare HR

### În Dezvoltare:
- 🚧 Generare PDF cu WeasyPrint
- 🚧 Calcul recursiv subordine
- 🚧 Export/Import date

## Troubleshooting

### Backend nu pornește
```bash
# Verifică PostgreSQL
psql -U postgres -c "SELECT version();"

# Verifică database
psql -U postgres -l | grep organigrama
```

### Frontend nu se conectează
```bash
# Verifică .env
cat .env

# Verifică backend rulează
curl http://localhost:8000/health
```

### Erori de autentificare
```bash
# Resetează token
localStorage.removeItem('auth_token');

# Sau din browser console
localStorage.clear();
```

## Notă Importantă

Această migrare păstrează EXACT aceeași funcționalitate ca versiunea base44, doar schimbă stack-ul tehnic conform specificațiilor MVP.
