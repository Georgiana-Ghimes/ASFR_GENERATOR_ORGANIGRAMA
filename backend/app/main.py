from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from app.api import versions, units, positions, employees, assignments, auth, layout, users, unit_types, omti_snapshots

app = FastAPI(
    title="Organigrama API",
    description="API pentru gestionarea organigramei administrative",
    version="1.0.0"
)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    print(f"Validation error on {request.method} {request.url}")
    print(f"Body: {await request.body()}")
    print(f"Errors: {exc.errors()}")
    return JSONResponse(status_code=422, content={"detail": exc.errors()})

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:3000", "http://10.10.20.186:8082"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(users.router, prefix="/api", tags=["users"])
app.include_router(versions.router, prefix="/api/versions", tags=["versions"])
app.include_router(units.router, prefix="/api/units", tags=["units"])
app.include_router(positions.router, prefix="/api/positions", tags=["positions"])
app.include_router(employees.router, prefix="/api/employees", tags=["employees"])
app.include_router(assignments.router, prefix="/api/assignments", tags=["assignments"])
app.include_router(layout.router, prefix="/api", tags=["layout"])
app.include_router(unit_types.router, prefix="/api/unit-types", tags=["unit-types"])
app.include_router(omti_snapshots.router, prefix="/api/omti-snapshots", tags=["omti-snapshots"])

@app.get("/")
def root():
    return {"message": "Organigrama API"}

@app.get("/health")
@app.get("/api/health")
def health():
    return {"status": "ok"}
