# Organigrama Backend - FastAPI + PostgreSQL

## Setup

### 1. Install PostgreSQL
Asigurați-vă că PostgreSQL este instalat și rulează.

### 2. Create Database
```bash
createdb organigrama
```

### 3. Install Python Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 4. Configure Environment
```bash
cp .env.example .env
# Edit .env with your database credentials
```

### 5. Initialize Database
```bash
python init_db.py
```

Acest script va crea tabelele și un user admin implicit:
- Email: `admin@organigrama.ro`
- Password: `admin123`

### 6. Run Server
```bash
uvicorn app.main:app --reload --port 8000
```

API va fi disponibil la: `http://localhost:8000`
Documentație interactivă: `http://localhost:8000/docs`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Versions
- `GET /api/versions` - List all versions
- `POST /api/versions` - Create version
- `PUT /api/versions/{id}` - Update version
- `DELETE /api/versions/{id}` - Delete version

### Units
- `GET /api/units?version_id={id}` - List units
- `POST /api/units` - Create unit
- `PUT /api/units/{id}` - Update unit
- `DELETE /api/units/{id}` - Delete unit

### Positions
- `GET /api/positions?version_id={id}&unit_id={id}` - List positions
- `POST /api/positions` - Create position
- `PUT /api/positions/{id}` - Update position
- `DELETE /api/positions/{id}` - Delete position

### Employees
- `GET /api/employees` - List employees
- `POST /api/employees` - Create employee
- `PUT /api/employees/{id}` - Update employee
- `DELETE /api/employees/{id}` - Deactivate employee

### Assignments
- `GET /api/assignments` - List assignments
- `POST /api/assignments` - Create assignment
- `PUT /api/assignments/{id}` - Update assignment
- `DELETE /api/assignments/{id}` - Delete assignment

## User Roles

- `viewer` - Can only view
- `editor` - Can create and edit drafts
- `approver` - Can approve versions
- `admin` - Full access
