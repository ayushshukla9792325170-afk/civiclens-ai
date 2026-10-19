from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import Department, Ward, User
from app.schemas.schemas import (
    DepartmentResponse, DepartmentCreate, DepartmentUpdate, WardResponse
)
from app.core.permissions import require_admin
from app.utils.audit import record_audit_log

router = APIRouter(prefix="/departments", tags=["Departments & Wards"])

@router.get("", response_model=List[DepartmentResponse])
def get_departments(db: Session = Depends(get_db)):
    """Returns all active municipal departments."""
    depts = db.query(Department).filter(Department.is_active == True).order_by(Department.name.asc()).all()
    return [DepartmentResponse.model_validate(d) for d in depts]

@router.get("/all", response_model=List[DepartmentResponse])
def get_all_departments_admin(
    user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Admin endpoint to retrieve all departments including deactivated ones."""
    depts = db.query(Department).order_by(Department.name.asc()).all()
    return [DepartmentResponse.model_validate(d) for d in depts]

@router.get("/wards", response_model=List[WardResponse])
def get_wards(db: Session = Depends(get_db)):
    """Returns municipal wards for geolocation mapping and filtering."""
    wards = db.query(Ward).order_by(Ward.code.asc()).all()
    return [WardResponse.model_validate(w) for w in wards]

@router.post("", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED)
def create_department(
    dept_in: DepartmentCreate,
    user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Admin creates a new municipal department."""
    existing = db.query(Department).filter(
        (Department.name == dept_in.name) | (Department.code == dept_in.code)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Department with this name or code already exists.")

    dept = Department(
        name=dept_in.name.strip(),
        code=dept_in.code.strip().upper(),
        description=dept_in.description,
        contact_email=dept_in.contact_email,
        contact_phone=dept_in.contact_phone,
        coverage_areas=dept_in.coverage_areas,
        supported_categories=dept_in.supported_categories,
        service_target_hours=dept_in.service_target_hours,
        is_active=dept_in.is_active
    )
    db.add(dept)
    db.commit()
    db.refresh(dept)

    record_audit_log(
        db=db,
        actor_user_id=user.id,
        action="CREATE_DEPARTMENT",
        entity_type="DEPARTMENT",
        entity_id=dept.id,
        after_state=dept_in.model_dump()
    )

    return DepartmentResponse.model_validate(dept)

@router.put("/{id}", response_model=DepartmentResponse)
def update_department(
    id: str,
    dept_in: DepartmentUpdate,
    user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Admin updates department configuration or deactivates it."""
    dept = db.query(Department).filter(Department.id == id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")

    before_state = {
        "name": dept.name,
        "is_active": dept.is_active,
        "service_target_hours": dept.service_target_hours
    }

    if dept_in.name is not None:
        dept.name = dept_in.name.strip()
    if dept_in.description is not None:
        dept.description = dept_in.description
    if dept_in.contact_email is not None:
        dept.contact_email = dept_in.contact_email
    if dept_in.contact_phone is not None:
        dept.contact_phone = dept_in.contact_phone
    if dept_in.coverage_areas is not None:
        dept.coverage_areas = dept_in.coverage_areas
    if dept_in.supported_categories is not None:
        dept.supported_categories = dept_in.supported_categories
    if dept_in.service_target_hours is not None:
        dept.service_target_hours = dept_in.service_target_hours
    if dept_in.is_active is not None:
        dept.is_active = dept_in.is_active

    db.commit()
    db.refresh(dept)

    record_audit_log(
        db=db,
        actor_user_id=user.id,
        action="UPDATE_DEPARTMENT",
        entity_type="DEPARTMENT",
        entity_id=dept.id,
        before_state=before_state,
        after_state={"name": dept.name, "is_active": dept.is_active}
    )

    return DepartmentResponse.model_validate(dept)
