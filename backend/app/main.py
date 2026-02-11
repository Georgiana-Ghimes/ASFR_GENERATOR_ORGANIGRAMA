from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import versions, units, positions, employees, assignments, auth

app = FastAPI(
    title="Organigrama API",
    description="API pentru gestionarea organigramei administrative",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(versions.router, prefix="/api/versions", tags=["versions"])
app.include_router(units.router, prefix="/api/units", tags=["units"])
app.include_router(positions.router, prefix="/api/positions", tags=["positions"])
app.include_router(employees.router, prefix="/api/employees", tags=["employees"])
app.include_router(assignments.router, prefix="/api/assignments", tags=["assignments"])

@app.get("/")
def root():
    return {"message": "Organigrama API"}

@app.get("/health")
def health():
    return {"status": "ok"}
