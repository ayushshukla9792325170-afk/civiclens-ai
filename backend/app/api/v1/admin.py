from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_
from app.db.session import get_db
from app.models.models import User, AuditLog, SystemSetting, Department, Complaint
from app.schemas.schemas import (
    UserResponse, UserRoleUpdate, UserStatusUpdate, AuditLogResponse
)
from app.core.permissions import require_admin
from app.utils.audit import record_audit_log

router = APIRouter(prefix="/admin", tags=["Administration"])

@router.get("/users", response_model=List[UserResponse])
def list_users(
    role: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Admin searches and filters all registered users."""
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    if status:
        query = query.filter(User.account_status == status)
    if search:
        search_filter = f"%{search.strip()}%"
        query = query.filter(
            or_(User.name.ilike(search_filter), User.email.ilike(search_filter))
        )
    users = query.order_by(desc(User.created_at)).all()
    return [UserResponse.model_validate(u) for u in users]

@router.put("/users/{user_id}/role", response_model=UserResponse)
def update_user_role(
    user_id: str,
    role_in: UserRoleUpdate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Grants or revokes roles (CITIZEN, OFFICER, ADMIN).
    Protects against removing the last active administrator.
    """
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    # Protection: check if removing last admin
    if target.role == "ADMIN" and role_in.role != "ADMIN":
        admin_count = db.query(User).filter(User.role == "ADMIN", User.account_status == "ACTIVE").count()
        if admin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Security constraint: Cannot revoke the last active administrator."
            )

    old_role = target.role
    old_dept = target.department_id

    target.role = role_in.role
    if role_in.department_id:
        dept = db.query(Department).filter(Department.id == role_in.department_id).first()
        if dept:
            target.department_id = dept.id
    elif role_in.role != "OFFICER":
        target.department_id = None

    db.commit()
    db.refresh(target)

    record_audit_log(
        db=db,
        actor_user_id=admin.id,
        action="UPDATE_USER_ROLE",
        entity_type="USER",
        entity_id=target.id,
        before_state={"role": old_role, "department_id": old_dept},
        after_state={"role": target.role, "department_id": target.department_id},
        reason=f"Role changed by Admin {admin.name}"
    )

    return UserResponse.model_validate(target)

@router.put("/users/{user_id}/status", response_model=UserResponse)
def update_user_status(
    user_id: str,
    status_in: UserStatusUpdate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Activates, deactivates, or suspends user accounts."""
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    if target.role == "ADMIN" and status_in.account_status != "ACTIVE":
        admin_count = db.query(User).filter(User.role == "ADMIN", User.account_status == "ACTIVE").count()
        if admin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Security constraint: Cannot deactivate the last active administrator."
            )

    old_status = target.account_status
    target.account_status = status_in.account_status
    db.commit()
    db.refresh(target)

    record_audit_log(
        db=db,
        actor_user_id=admin.id,
        action="UPDATE_USER_STATUS",
        entity_type="USER",
        entity_id=target.id,
        before_state={"status": old_status},
        after_state={"status": target.account_status},
        reason=status_in.reason or "Administrative status adjustment"
    )

    return UserResponse.model_validate(target)

@router.get("/audit-logs", response_model=List[AuditLogResponse])
def get_audit_logs(
    action: Optional[str] = None,
    entity_type: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Queries administrative and operational audit trail."""
    query = db.query(AuditLog)
    if action:
        query = query.filter(AuditLog.action == action)
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)

    logs = query.order_by(desc(AuditLog.created_at)).limit(limit).all()
    results = []
    for l in logs:
        actor_name = l.actor.name if l.actor else "System"
        results.append(
            AuditLogResponse(
                id=l.id,
                actor_user_id=l.actor_user_id,
                actor_name=actor_name,
                action=l.action,
                entity_type=l.entity_type,
                entity_id=l.entity_id,
                before_state=l.before_state,
                after_state=l.after_state,
                reason=l.reason,
                ip_address=l.ip_address,
                created_at=l.created_at
            )
        )
    return results

@router.get("/settings")
def get_settings(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Retrieves all configurable platform system settings."""
    db_settings = db.query(SystemSetting).all()
    out = {s.key: s.value for s in db_settings}
    # Provide system defaults if not in DB
    defaults = {
        "duplicate_distance_threshold_meters": 150.0,
        "default_sla_hours": 48,
        "critical_sla_hours": 12,
        "citizen_verification_timeout_days": 14,
        "allowed_categories": [
            "POTHOLE", "GARBAGE", "STREETLIGHT", "DRAINAGE",
            "ROAD_DAMAGE", "DAMAGED_SIGN", "WATER_LEAKAGE", "ILLEGAL_DUMPING", "OTHER"
        ]
    }
    defaults.update(out)
    return defaults

@router.put("/settings/{key}")
def update_setting(
    key: str,
    payload: Dict[str, Any],
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Updates a system configuration setting."""
    val = payload.get("value")
    setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    if not setting:
        setting = SystemSetting(key=key, value=val, updated_by_id=admin.id)
        db.add(setting)
    else:
        setting.value = val
        setting.updated_by_id = admin.id

    db.commit()
    record_audit_log(
        db=db,
        actor_user_id=admin.id,
        action="UPDATE_SETTING",
        entity_type="SETTING",
        entity_id=key,
        after_state={"key": key, "value": val}
    )
    return {"message": f"Setting '{key}' successfully saved."}
