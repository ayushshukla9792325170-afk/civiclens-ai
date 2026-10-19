from typing import Optional, Tuple
from sqlalchemy.orm import Session
from app.models.models import Department

DEFAULT_CATEGORY_ROUTING = {
    "POTHOLE": "PWD",
    "ROAD_DAMAGE": "PWD",
    "GARBAGE": "SWM",
    "ILLEGAL_DUMPING": "SWM",
    "STREETLIGHT": "ELEC",
    "DRAINAGE": "WATER",
    "WATER_LEAKAGE": "WATER",
    "DAMAGED_SIGN": "TRAFFIC",
    "OTHER": "PWD"
}

def recommend_department(category: str, db: Session) -> Tuple[Optional[Department], str, str]:
    """
    Recommends the responsible municipal department for an issue category.
    Returns (Department instance, dept_code, dept_name).
    """
    dept_code = DEFAULT_CATEGORY_ROUTING.get(category, "PWD")
    department = db.query(Department).filter(Department.code == dept_code, Department.is_active == True).first()
    
    if department:
        return department, department.code, department.name
    
    # Fallback to any active department or generic
    first_dept = db.query(Department).filter(Department.is_active == True).first()
    if first_dept:
        return first_dept, first_dept.code, first_dept.name
    
    return None, dept_code, "Public Works Department"
