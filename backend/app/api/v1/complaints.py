from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_

from app.db.session import get_db
from app.models.models import (
    Complaint, ComplaintEvidence, ComplaintUpdate, Feedback,
    DuplicateCandidate, Department, User, Ward
)
from app.schemas.schemas import (
    ComplaintCreate, ComplaintResponse, ComplaintDetailResponse,
    ComplaintStatusChangeRequest, ComplaintAssignRequest, ComplaintOverrideRequest,
    FeedbackCreate, FeedbackResponse, PaginatedComplaintsResponse, ComplaintUpdateResponse,
    EvidenceResponse
)
from app.core.permissions import (
    get_current_active_user, get_current_user_optional,
    require_officer, require_citizen, require_admin
)
from app.services.complaints.complaint_service import (
    create_complaint, transition_complaint_status, assign_complaint, override_complaint
)

router = APIRouter(prefix="/complaints", tags=["Complaints"])

def build_complaint_response(c: Complaint, db: Session, is_public_view: bool = False) -> ComplaintResponse:
    # Resolve names
    reporter_name = "Anonymous Citizen" if is_public_view else (c.reporter.name if c.reporter else "Citizen")
    dept_name = c.department.name if c.department else None
    officer_name = c.assigned_officer.name if c.assigned_officer else None

    evidence_responses = [
        EvidenceResponse(
            id=e.id,
            complaint_id=e.complaint_id,
            storage_key=e.storage_key,
            evidence_type=e.evidence_type,
            original_filename=e.original_filename,
            content_type=e.content_type,
            file_size_bytes=e.file_size_bytes,
            uploader_id=e.uploader_id if not is_public_view else None,
            created_at=e.created_at
        )
        for e in c.evidence_items
    ]

    feedback_response = None
    if c.feedback:
        feedback_response = FeedbackResponse.model_validate(c.feedback)

    return ComplaintResponse(
        id=c.id,
        reference_number=c.reference_number,
        user_id=c.user_id if not is_public_view else "citizen",
        reporter_name=reporter_name,
        title=c.title,
        description=c.description,
        category=c.category,
        severity=c.severity,
        severity_explanation=c.severity_explanation,
        ai_confidence=c.ai_confidence,
        ai_analysis_mode=c.ai_analysis_mode,
        department_id=c.department_id,
        department_name=dept_name,
        assigned_officer_id=c.assigned_officer_id,
        assigned_officer_name=officer_name,
        status=c.status,
        latitude=c.latitude,
        longitude=c.longitude,
        address=c.address,
        ward_id=c.ward_id,
        ward_name=c.ward_name,
        is_public=c.is_public,
        resolution_notes=c.resolution_notes,
        resolved_at=c.resolved_at,
        citizen_verified_at=c.citizen_verified_at,
        created_at=c.created_at,
        updated_at=c.updated_at,
        evidence_items=evidence_responses,
        feedback=feedback_response
    )

@router.post("", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED)
def submit_complaint(
    complaint_in: ComplaintCreate,
    user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Submits a new civic complaint with validation and AI orchestration."""
    complaint = create_complaint(db, complaint_in, user)
    return build_complaint_response(complaint, db)

@router.get("", response_model=PaginatedComplaintsResponse)
def list_complaints(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    category: Optional[str] = None,
    severity: Optional[str] = None,
    department_id: Optional[str] = None,
    ward_id: Optional[str] = None,
    search: Optional[str] = None,
    user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Lists authorized complaints with server-side pagination, search, and multi-field filters.
    Officers from a specific department can view their department records or general queue.
    """
    query = db.query(Complaint)

    # Department scoping for officers
    if user.role == "OFFICER" and user.department_id:
        # If no specific dept requested, default to their dept OR unassigned complaints
        if not department_id:
            query = query.filter(
                or_(
                    Complaint.department_id == user.department_id,
                    Complaint.department_id == None
                )
            )

    if department_id:
        query = query.filter(Complaint.department_id == department_id)
    if status:
        query = query.filter(Complaint.status == status)
    if category:
        query = query.filter(Complaint.category == category)
    if severity:
        query = query.filter(Complaint.severity == severity)
    if ward_id:
        query = query.filter(Complaint.ward_id == ward_id)
    if search:
        search_filter = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Complaint.reference_number.ilike(search_filter),
                Complaint.title.ilike(search_filter),
                Complaint.description.ilike(search_filter),
                Complaint.address.ilike(search_filter)
            )
        )

    total = query.count()
    items = query.order_by(desc(Complaint.created_at)).offset((page - 1) * page_size).limit(page_size).all()
    res_items = [build_complaint_response(c, db) for c in items]

    return PaginatedComplaintsResponse(
        total=total,
        page=page,
        page_size=page_size,
        items=res_items
    )

@router.get("/public", response_model=PaginatedComplaintsResponse)
def list_public_complaints(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    category: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Returns publicly visible civic issues with privacy-safe reporter redaction."""
    query = db.query(Complaint).filter(Complaint.is_public == True)
    if category:
        query = query.filter(Complaint.category == category)
    if status:
        query = query.filter(Complaint.status == status)

    total = query.count()
    items = query.order_by(desc(Complaint.created_at)).offset((page - 1) * page_size).limit(page_size).all()
    res_items = [build_complaint_response(c, db, is_public_view=True) for c in items]

    return PaginatedComplaintsResponse(
        total=total,
        page=page,
        page_size=page_size,
        items=res_items
    )

@router.get("/my", response_model=PaginatedComplaintsResponse)
def list_my_complaints(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Lists the authenticated citizen's personal complaints."""
    query = db.query(Complaint).filter(Complaint.user_id == user.id)
    if status:
        query = query.filter(Complaint.status == status)

    total = query.count()
    items = query.order_by(desc(Complaint.created_at)).offset((page - 1) * page_size).limit(page_size).all()
    res_items = [build_complaint_response(c, db) for c in items]

    return PaginatedComplaintsResponse(
        total=total,
        page=page,
        page_size=page_size,
        items=res_items
    )

@router.get("/{id}", response_model=ComplaintDetailResponse)
def get_complaint_detail(
    id: str,
    user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    Returns complete complaint details, status timeline, and evidence.
    Restricts internal officer notes from unauthorized citizens.
    """
    complaint = db.query(Complaint).filter(Complaint.id == id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    is_staff = user and user.role in ["OFFICER", "ADMIN"]
    is_owner = user and user.id == complaint.user_id

    # If complaint is private and user is neither owner nor staff -> 403
    if not complaint.is_public and not (is_owner or is_staff):
        raise HTTPException(status_code=403, detail="Access to private complaint record is restricted.")

    base_res = build_complaint_response(complaint, db, is_public_view=(not is_staff and not is_owner))

    # Build updates timeline
    updates = []
    for u in complaint.updates:
        # Redact internal note if viewer is not staff
        internal = u.internal_note if is_staff else None
        updater_name = u.updated_by.name if u.updated_by else "System"
        updates.append(
            ComplaintUpdateResponse(
                id=u.id,
                complaint_id=u.complaint_id,
                previous_status=u.previous_status,
                new_status=u.new_status,
                public_comment=u.public_comment,
                internal_note=internal,
                updated_by_id=u.updated_by_id if is_staff else None,
                updated_by_name=updater_name,
                created_at=u.created_at
            )
        )

    dup_count = db.query(DuplicateCandidate).filter(DuplicateCandidate.source_complaint_id == complaint.id).count()

    return ComplaintDetailResponse(
        **base_res.model_dump(),
        updates=updates,
        duplicate_count=dup_count
    )

@router.put("/{id}/status", response_model=ComplaintResponse)
def update_status(
    id: str,
    status_change: ComplaintStatusChangeRequest,
    user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Transitions complaint through its lifecycle with validation and audit trail."""
    complaint = transition_complaint_status(db, id, status_change, user)
    return build_complaint_response(complaint, db)

@router.put("/{id}/assign", response_model=ComplaintResponse)
def assign_complaint_route(
    id: str,
    assign_in: ComplaintAssignRequest,
    user: User = Depends(require_officer),
    db: Session = Depends(get_db)
):
    """Assigns complaint to a municipal department or officer."""
    complaint = assign_complaint(db, id, assign_in, user)
    return build_complaint_response(complaint, db)

@router.put("/{id}/override", response_model=ComplaintResponse)
def override_complaint_route(
    id: str,
    override_in: ComplaintOverrideRequest,
    user: User = Depends(require_officer),
    db: Session = Depends(get_db)
):
    """Records an officer override of category, severity, or department with explanation."""
    complaint = override_complaint(db, id, override_in, user)
    return build_complaint_response(complaint, db)

@router.post("/{id}/feedback", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED)
def submit_feedback(
    id: str,
    feedback_in: FeedbackCreate,
    user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Allows citizen to submit satisfaction rating and review for resolved complaints."""
    complaint = db.query(Complaint).filter(Complaint.id == id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    if complaint.user_id != user.id:
        raise HTTPException(status_code=403, detail="Only the reporting citizen can submit resolution feedback.")

    if complaint.status not in ["RESOLVED", "CITIZEN_VERIFIED"]:
        raise HTTPException(status_code=400, detail="Feedback can only be provided for resolved complaints.")

    existing = db.query(Feedback).filter(Feedback.complaint_id == id).first()
    if existing:
        existing.rating = feedback_in.rating
        existing.comment = feedback_in.comment
        db.commit()
        db.refresh(existing)
        return FeedbackResponse.model_validate(existing)

    feedback = Feedback(
        complaint_id=id,
        citizen_id=user.id,
        rating=feedback_in.rating,
        comment=feedback_in.comment
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return FeedbackResponse.model_validate(feedback)
