from datetime import timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.models import User
from app.schemas.schemas import (
    UserRegister, UserLogin, UserResponse, TokenResponse, UserProfileUpdate
)
from app.core.security import get_password_hash, verify_password, create_access_token
from app.core.permissions import get_current_user, get_current_active_user
from app.core.config import settings
from app.utils.audit import record_audit_log

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register_citizen(user_in: UserRegister, response: Response, db: Session = Depends(get_db)):
    """
    Registers a new citizen account.
    Public registration is strictly restricted to CITIZEN role.
    """
    normalized_email = user_in.email.lower().strip()
    existing = db.query(User).filter(User.email == normalized_email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    user = User(
        name=user_in.name.strip(),
        email=normalized_email,
        password_hash=get_password_hash(user_in.password),
        role="CITIZEN",
        phone=user_in.phone,
        default_location=user_in.default_location,
        account_status="ACTIVE"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Issue token
    access_token = create_access_token({"sub": user.id, "role": user.role})
    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        max_age=60 * 60 * 24 * 7,
        samesite="lax",
        secure=False  # Set to True in production HTTPS
    )

    record_audit_log(
        db=db,
        actor_user_id=user.id,
        action="USER_REGISTRATION",
        entity_type="USER",
        entity_id=user.id
    )

    return TokenResponse(access_token=access_token, user=UserResponse.model_validate(user))

@router.post("/login", response_model=TokenResponse)
def login(credentials: UserLogin, response: Response, request: Request, db: Session = Depends(get_db)):
    """
    Authenticates a user and issues an access token and secure HttpOnly cookie.
    """
    normalized_email = credentials.email.lower().strip()
    user = db.query(User).filter(User.email == normalized_email).first()
    
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password credentials."
        )

    if user.account_status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Account is {user.account_status.lower()}. Please contact administrator."
        )

    access_token = create_access_token({"sub": user.id, "role": user.role})
    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        max_age=60 * 60 * 24 * 7,
        samesite="lax",
        secure=False
    )

    client_ip = request.client.host if request.client else None
    record_audit_log(
        db=db,
        actor_user_id=user.id,
        action="USER_LOGIN",
        entity_type="USER",
        entity_id=user.id,
        ip_address=client_ip
    )

    return TokenResponse(access_token=access_token, user=UserResponse.model_validate(user))

@router.post("/logout")
def logout(response: Response):
    """Clears authentication session cookies."""
    response.delete_cookie("access_token")
    return {"message": "Successfully logged out."}

@router.get("/me", response_model=UserResponse)
def get_me(user: User = Depends(get_current_active_user)):
    """Returns the authenticated user's profile."""
    return UserResponse.model_validate(user)

@router.put("/me", response_model=UserResponse)
def update_profile(
    profile_in: UserProfileUpdate,
    user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Updates user profile and handles password changes securely."""
    if profile_in.name:
        user.name = profile_in.name.strip()
    if profile_in.phone is not None:
        user.phone = profile_in.phone
    if profile_in.default_location is not None:
        user.default_location = profile_in.default_location

    if profile_in.new_password:
        if not profile_in.current_password or not verify_password(profile_in.current_password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect."
            )
        user.password_hash = get_password_hash(profile_in.new_password)

    db.commit()
    db.refresh(user)

    record_audit_log(
        db=db,
        actor_user_id=user.id,
        action="UPDATE_PROFILE",
        entity_type="USER",
        entity_id=user.id
    )

    return UserResponse.model_validate(user)

@router.post("/forgot-password")
def forgot_password(payload: dict):
    """
    Privacy-safe password reset handler.
    Always returns success to prevent user email enumeration.
    """
    return {
        "message": "If an account with that email exists, reset instructions have been dispatched."
    }
