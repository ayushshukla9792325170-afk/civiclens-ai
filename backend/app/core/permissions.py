from typing import Optional, List
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.security import decode_access_token
from app.models.models import User

security_scheme = HTTPBearer(auto_error=False)

def get_token_from_request(request: Request, credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme)) -> Optional[str]:
    """
    Extracts JWT from Authorization header Bearer token,
    or falls back to secure HttpOnly cookie 'access_token'.
    """
    if credentials and credentials.scheme.lower() == "bearer":
        return credentials.credentials
    cookie_token = request.cookies.get("access_token")
    if cookie_token:
        # Strip potential Bearer prefix if in cookie
        if cookie_token.startswith("Bearer "):
            return cookie_token[7:]
        return cookie_token
    return None

def get_current_user_optional(
    token: Optional[str] = Depends(get_token_from_request),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Returns the authenticated user or None if not authenticated."""
    if not token:
        return None
    payload = decode_access_token(token)
    if not payload:
        return None
    user_id = payload.get("sub")
    if not user_id:
        return None
    user = db.query(User).filter(User.id == user_id).first()
    return user

def get_current_user(
    user: Optional[User] = Depends(get_current_user_optional)
) -> User:
    """Requires an authenticated user, otherwise raises 401 Unauthorized."""
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided or are invalid",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

def get_current_active_user(
    user: User = Depends(get_current_user)
) -> User:
    """Verifies that the user account is active."""
    if user.account_status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"User account is {user.account_status.lower()}",
        )
    return user

class RoleChecker:
    """Dependency that enforces role-based access control."""
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: User = Depends(get_current_active_user)) -> User:
        if user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted. Required role: {', '.join(self.allowed_roles)}",
            )
        return user

def require_citizen(user: User = Depends(RoleChecker(["CITIZEN", "ADMIN"]))) -> User:
    return user

def require_officer(user: User = Depends(RoleChecker(["OFFICER", "ADMIN"]))) -> User:
    return user

def require_admin(user: User = Depends(RoleChecker(["ADMIN"]))) -> User:
    return user
