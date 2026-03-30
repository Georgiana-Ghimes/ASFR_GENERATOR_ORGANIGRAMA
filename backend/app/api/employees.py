from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.database import get_db
from app.models import Employee, User
from app.schemas import Employee as EmployeeSchema, EmployeeCreate, EmployeeUpdate
from app.auth import get_current_user, require_role

router = APIRouter()

@router.get("", response_model=List[EmployeeSchema])
def list_employees(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Employee).filter(Employee.active == True).all()

@router.get("/{employee_id}", response_model=EmployeeSchema)
def get_employee(
    employee_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return employee

@router.post("", response_model=EmployeeSchema)
def create_employee(
    employee_data: EmployeeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("editor"))
):
    employee = Employee(**employee_data.model_dump())
    db.add(employee)
    db.commit()
    db.refresh(employee)
    return employee

@router.put("/{employee_id}", response_model=EmployeeSchema)
def update_employee(
    employee_id: UUID,
    employee_data: EmployeeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("editor"))
):
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    for key, value in employee_data.model_dump(exclude_unset=True).items():
        setattr(employee, key, value)
    
    db.commit()
    db.refresh(employee)
    return employee

@router.delete("/{employee_id}")
def delete_employee(
    employee_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("editor"))
):
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Soft delete
    employee.active = False
    db.commit()
    return {"message": "Employee deactivated"}
