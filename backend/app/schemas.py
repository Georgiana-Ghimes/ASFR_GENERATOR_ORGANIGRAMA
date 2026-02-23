from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, date
from uuid import UUID
from app.models import UnitType, VersionStatus, EmployeeStatus, PositionType

# Version Schemas
class OrgVersionBase(BaseModel):
    version_number: str
    name: str
    notes: Optional[str] = None
    chart_title: Optional[str] = "CODIFICAREA STRUCTURILOR DIN ANEXA LA OMTI NR. 48/23.01.2026"

class OrgVersionCreate(OrgVersionBase):
    status: VersionStatus = VersionStatus.draft

class OrgVersionUpdate(BaseModel):
    version_number: Optional[str] = None
    name: Optional[str] = None
    status: Optional[VersionStatus] = None
    notes: Optional[str] = None
    chart_title: Optional[str] = None
    approved_by: Optional[str] = None
    approved_date: Optional[datetime] = None

class OrgVersion(OrgVersionBase):
    id: UUID
    status: VersionStatus
    created_date: datetime
    chart_title: Optional[str] = None
    approved_by: Optional[str] = None
    approved_date: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Unit Schemas
class OrgUnitBase(BaseModel):
    stas_code: str
    name: str
    unit_type: UnitType
    parent_unit_id: Optional[UUID] = None
    order_index: int = 0
    leadership_count: int = 0
    execution_count: int = 0
    color: Optional[str] = None
    custom_x: Optional[int] = None
    custom_y: Optional[int] = None
    custom_height: Optional[int] = None
    custom_width: Optional[int] = None
    director_title: Optional[str] = None
    director_name: Optional[str] = None
    legend_col1: Optional[str] = None
    legend_col2: Optional[str] = None
    legend_col3: Optional[str] = None
    is_rotated: bool = False

class OrgUnitCreate(OrgUnitBase):
    version_id: UUID

class OrgUnitUpdate(BaseModel):
    stas_code: Optional[str] = None
    name: Optional[str] = None
    unit_type: Optional[UnitType] = None
    parent_unit_id: Optional[UUID] = None
    order_index: Optional[int] = None
    leadership_count: Optional[int] = None
    execution_count: Optional[int] = None
    color: Optional[str] = None
    custom_x: Optional[int] = None
    custom_y: Optional[int] = None
    custom_height: Optional[int] = None
    custom_width: Optional[int] = None
    director_title: Optional[str] = None
    director_name: Optional[str] = None
    legend_col1: Optional[str] = None
    legend_col2: Optional[str] = None
    legend_col3: Optional[str] = None
    is_rotated: Optional[bool] = None

class OrgUnit(OrgUnitBase):
    id: UUID
    version_id: UUID
    
    class Config:
        from_attributes = True

# Position Schemas
class PositionBase(BaseModel):
    title: str
    is_leadership: bool = False
    grade: Optional[str] = None
    is_vacant: bool = True
    order_index: int = 0

class PositionCreate(PositionBase):
    version_id: UUID
    unit_id: UUID

class PositionUpdate(BaseModel):
    title: Optional[str] = None
    is_leadership: Optional[bool] = None
    grade: Optional[str] = None
    is_vacant: Optional[bool] = None
    order_index: Optional[int] = None

class Position(PositionBase):
    id: UUID
    version_id: UUID
    unit_id: UUID
    
    class Config:
        from_attributes = True

# Employee Schemas
class EmployeeBase(BaseModel):
    first_name: str
    last_name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    hire_date: Optional[date] = None
    status: EmployeeStatus = EmployeeStatus.active
    unit_id: Optional[UUID] = None
    position_type: Optional[PositionType] = None

class EmployeeCreate(EmployeeBase):
    pass

class EmployeeUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    hire_date: Optional[date] = None
    status: Optional[EmployeeStatus] = None
    active: Optional[bool] = None
    unit_id: Optional[UUID] = None
    position_type: Optional[PositionType] = None

class Employee(EmployeeBase):
    id: UUID
    active: bool
    
    class Config:
        from_attributes = True

# Assignment Schemas
class PositionAssignmentBase(BaseModel):
    position_id: UUID
    employee_id: UUID
    start_date: date
    end_date: Optional[date] = None

class PositionAssignmentCreate(PositionAssignmentBase):
    pass

class PositionAssignmentUpdate(BaseModel):
    end_date: Optional[date] = None

class PositionAssignment(PositionAssignmentBase):
    id: UUID
    
    class Config:
        from_attributes = True

# Auth Schemas
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: str = "viewer"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class UserResponse(BaseModel):
    id: UUID
    email: str
    role: str
    active: bool
    
    class Config:
        from_attributes = True
