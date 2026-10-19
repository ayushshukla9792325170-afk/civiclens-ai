from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.models import AuditLog

SENSITIVE_KEYS = {"password", "password_hash", "token", "access_token", "secret", "authorization"}

def sanitize_state(state: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """Sanitizes state dictionaries to prevent leaking passwords or secret keys in audit trails."""
    if not state or not isinstance(state, dict):
        return state
    sanitized = {}
    for k, v in state.items():
        if any(secret in k.lower() for secret in SENSITIVE_KEYS):
            sanitized[k] = "[REDACTED]"
        else:
            sanitized[k] = v
    return sanitized

def record_audit_log(
    db: Session,
    actor_user_id: Optional[str],
    action: str,
    entity_type: str,
    entity_id: Optional[str] = None,
    before_state: Optional[Dict[str, Any]] = None,
    after_state: Optional[Dict[str, Any]] = None,
    reason: Optional[str] = None,
    ip_address: Optional[str] = None
) -> AuditLog:
    """
    Persists an immutable audit log entry.
    """
    log = AuditLog(
        actor_user_id=actor_user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        before_state=sanitize_state(before_state),
        after_state=sanitize_state(after_state),
        reason=reason,
        ip_address=ip_address
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log
