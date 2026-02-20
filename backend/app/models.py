from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Enum, Text, Date
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum
from app.database import Base

class UnitType(str, enum.Enum):
    director_general = "director_general"
    directie = "directie"
    serviciu = "serviciu"
    compartiment = "compartiment"
    inspectorat = "inspectorat"
    birou = "birou"
    consiliu = "consiliu"  # Special unit type for Consiliul de Conducere

class VersionStatus(str, enum.Enum):
    draft = "draft"
    pending_approval = "pending_approval"
    approved = "approved"
    archived = "archived"

class EmployeeStatus(str, enum.Enum):
    active = "active"
    on_leave = "on_leave"
    terminated = "terminated"

class OrgVersion(Base):
    __tablename__ = "org_versions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    version_number = Column(String, nullable=False)
    name = Column(String, nullable=False)
    status = Column(Enum(VersionStatus), default=VersionStatus.draft, nullable=False)
    notes = Column(Text)
    chart_title = Column(String, default="CODIFICAREA STRUCTURILOR DIN ANEXA LA OMTI NR. 48/23.01.2026")
    created_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    approved_by = Column(String)
    approved_date = Column(DateTime)
    
    units = relationship("OrgUnit", back_populates="version", cascade="all, delete-orphan")
    positions = relationship("Position", back_populates="version", cascade="all, delete-orphan")

class OrgUnit(Base):
    __tablename__ = "organizational_units"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    version_id = Column(UUID(as_uuid=True), ForeignKey("org_versions.id"), nullable=False)
    stas_code = Column(String, nullable=False)
    name = Column(String, nullable=False)
    unit_type = Column(Enum(UnitType), nullable=False)
    parent_unit_id = Column(UUID(as_uuid=True), ForeignKey("organizational_units.id"))
    order_index = Column(Integer, default=0)
    leadership_count = Column(Integer, default=0)
    execution_count = Column(Integer, default=0)
    color = Column(String)
    custom_x = Column(Integer)  # Custom X position for manual layout
    custom_y = Column(Integer)  # Custom Y position for manual layout
    custom_height = Column(Integer)  # Custom height for manual sizing (in pixels, must be multiple of 20)
    custom_width = Column(Integer)  # Custom width for manual sizing (in pixels, must be multiple of 20)
    director_title = Column(String)  # Title for director_general unit (e.g., "DIRECTOR GENERAL")
    director_name = Column(String)  # Name for director_general unit (e.g., "Petru BOGDAN")
    
    version = relationship("OrgVersion", back_populates="units")
    parent = relationship("OrgUnit", remote_side=[id], backref="children")
    positions = relationship("Position", back_populates="unit", cascade="all, delete-orphan")

class Position(Base):
    __tablename__ = "positions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    version_id = Column(UUID(as_uuid=True), ForeignKey("org_versions.id"), nullable=False)
    unit_id = Column(UUID(as_uuid=True), ForeignKey("organizational_units.id"), nullable=False)
    title = Column(String, nullable=False)
    is_leadership = Column(Boolean, default=False, nullable=False)
    grade = Column(String)
    is_vacant = Column(Boolean, default=True)
    order_index = Column(Integer, default=0)
    
    version = relationship("OrgVersion", back_populates="positions")
    unit = relationship("OrgUnit", back_populates="positions")
    assignments = relationship("PositionAssignment", back_populates="position", cascade="all, delete-orphan")

class Employee(Base):
    __tablename__ = "employees"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    email = Column(String)
    phone = Column(String)
    hire_date = Column(Date)
    status = Column(Enum(EmployeeStatus), default=EmployeeStatus.active)
    active = Column(Boolean, default=True)
    
    assignments = relationship("PositionAssignment", back_populates="employee")

class PositionAssignment(Base):
    __tablename__ = "position_assignments"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    position_id = Column(UUID(as_uuid=True), ForeignKey("positions.id"), nullable=False)
    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id"), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date)
    
    position = relationship("Position", back_populates="assignments")
    employee = relationship("Employee", back_populates="assignments")

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="viewer")  # viewer, editor, approver, admin
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
