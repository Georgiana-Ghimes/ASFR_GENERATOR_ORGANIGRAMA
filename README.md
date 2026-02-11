# Organigrama Administrativă - MVP

Sistem intern de administrare a organigramei instituționale.

## Stack Tehnic

### Backend
- Python + FastAPI
- PostgreSQL
- SQLAlchemy ORM
- JWT Authentication
- WeasyPrint (PDF generation)

### Frontend
- React 18
- Vite
- TanStack Query (React Query)
- Tailwind CSS + shadcn/ui
- React Router

## Funcționalități MVP

- ✅ Creare versiune organigramă (Draft → Approved)
- ✅ Introducere structură STAS manual (cod, denumire, tip, părinte)
- ✅ Introducere posturi
- ✅ Introducere angajați manual
- ✅ Atribuire angajați la posturi
- ✅ Calcul automat total subordine
- 🚧 Generare PDF oficial (în dezvoltare)

## Setup

### 1. Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Configure database
cp .env.example .env
# Edit .env with your PostgreSQL credentials

# Initialize database
python init_db.py

# Run server
uvicorn app.main:app --reload --port 8000
```

Default admin user:
- Email: `admin@organigrama.ro`
- Password: `admin123`

### 2. Frontend Setup

```bash
# Install dependencies
npm install

# Configure API URL
cp .env.example .env
# Edit .env if needed (default: http://localhost:8000/api)

# Run development server
npm run dev
```

Frontend va fi disponibil la: `http://localhost:5173`

## API Documentation

După pornirea backend-ului, documentația interactivă este disponibilă la:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Roluri Utilizatori

- `viewer` - Poate doar vizualiza
- `editor` - Poate crea și edita ciorne
- `approver` - Poate aproba versiuni
- `admin` - Acces complet

## Business Rules

- Structura nu poate fi editată direct dacă versiunea este Approved
- Codurile STAS sunt introduse manual și validate pentru unicitate
- Totalul subordonării se calculează recursiv
- Nu se pot șterge unități din versiune aprobată

## Structură Proiect

```
.
├── backend/
│   ├── app/
│   │   ├── api/          # API endpoints
│   │   ├── models.py     # SQLAlchemy models
│   │   ├── schemas.py    # Pydantic schemas
│   │   ├── auth.py       # Authentication
│   │   ├── database.py   # Database config
│   │   └── main.py       # FastAPI app
│   ├── requirements.txt
│   └── init_db.py
├── src/
│   ├── api/
│   │   └── apiClient.js  # API client
│   ├── components/
│   │   ├── orgchart/     # Orgchart components
│   │   └── ui/           # shadcn/ui components
│   ├── pages/
│   │   ├── OrgChart.jsx
│   │   ├── Versions.jsx
│   │   └── Employees.jsx
│   └── lib/
│       └── AuthContext.jsx
└── README.md
```

## Development

### Backend
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
npm run dev
```

## Build pentru Producție

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Frontend
```bash
npm run build
npm run preview
```

## Migrare de la base44

Proiectul a fost migrat de la base44 (BaaS) la stack-ul specificat în documentul MVP:
- Backend: base44 → Python FastAPI + PostgreSQL
- Frontend: Păstrat React, înlocuit SDK-ul base44 cu API client custom
- Funcționalitatea: Păstrată exact ca în versiunea originală
