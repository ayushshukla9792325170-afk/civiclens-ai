from datetime import datetime, timezone
from typing import Optional, List, Dict, Any, Tuple
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from app.models.models import (
    Complaint, ComplaintEvidence, ComplaintUpdate, DuplicateCandidate,
    AIAnalysis, Feedback, Ward, Department, User
)
from app.schemas.schemas import (
    ComplaintCreate, ComplaintStatusChangeRequest, ComplaintAssignRequest,
    ComplaintOverrideRequest, FeedbackCreate
)
from app.utils.identifiers import generate_complaint_reference
from app.utils.audit import record_audit_log
from app.services.geospatial.geo import find_nearest_ward
from app.services.ai.orchestrator import run_civic_ai_pipeline
from app.services.notifications.notifier import create_notification

ALLOWED_STATUS_TRANSITIONS: Dict[str, List[str]] = {
    "SUBMITTED": ["VERIFIED", "ASSIGNED", "REJECTED"],
    "VERIFIED": ["ASSIGNED", "IN_PROGRESS", "REJECTED"],
    "ASSIGNED": ["IN_PROGRESS", "RESOLVED", "REJECTED"],
    "IN_PROGRESS": ["RESOLVED", "REJECTED"],
    "RESOLVED": ["CITIZEN_VERIFIED", "REOPENED"],
    "REOPENED": ["IN_PROGRESS", "ASSIGNED", "REJECTED"],
    "REJECTED": ["REOPENED"],
    "CITIZEN_VERIFIED": ["REOPENED"]
}

def create_complaint(db: Session, complaint_in: ComplaintCreate, user: User) -> Complaint:
    """
    Creates and persists a new civic complaint:
    1. Generates unique human-readable reference number.
    2. Identifies nearest ward if not provided.
    3. Runs AI pipeline (vision, classification, severity, routing, duplicate check).
    4. Persists Complaint, Evidence, AIAnalysis, DuplicateCandidates, and initial Update.
    5. Dispatches notifications.
    """
    # 1. Reference number
    ref_num = generate_complaint_reference()
    while db.query(Complaint).filter(Complaint.reference_number == ref_num).first():
        ref_num = generate_complaint_reference()

    # 2. Ward association
    ward_id = complaint_in.ward_id
    ward_name = complaint_in.ward_name
    if not ward_id:
        all_wards = db.query(Ward).all()
        nearest = find_nearest_ward(complaint_in.latitude, complaint_in.longitude, all_wards)
        if nearest:
            ward_id = nearest[0].id
            ward_name = nearest[0].name

    # 3. Primary image key for AI analysis
    primary_image = complaint_in.evidence_storage_keys[0] if complaint_in.evidence_storage_keys else None

    # 4. Run AI pipeline
    ai_result = run_civic_ai_pipeline(
        db=db,
        text_content=complaint_in.description,
        image_storage_key=primary_image,
        latitude=complaint_in.latitude,
        longitude=complaint_in.longitude
    )

    # Department lookup
    dept = db.query(Department).filter(
        (Department.code == ai_result.suggested_department_code) | 
        (Department.name == ai_result.suggested_department_name)
    ).first()
    dept_id = dept.id if dept else None

    # Use citizen-chosen category/severity if explicitly specified, otherwise AI recommendations
    final_category = complaint_in.category or ai_result.suggested_category
    final_severity = complaint_in.severity if complaint_in.severity != "MEDIUM" else ai_result.suggested_severity
    final_expl = complaint_in.severity_explanation or ai_result.severity_explanation

    # 5. Create Complaint entity
    complaint = Complaint(
        reference_number=ref_num,
        user_id=user.id,
        title=complaint_in.title,
        description=complaint_in.description,
        category=final_category,
        severity=final_severity,
        severity_explanation=final_expl,
        ai_confidence=ai_result.confidence_score,
        ai_analysis_mode=ai_result.analysis_mode,
        department_id=dept_id,
        status="SUBMITTED",
        latitude=complaint_in.latitude,
        longitude=complaint_in.longitude,
        address=complaint_in.address,
        ward_id=ward_id,
        ward_name=ward_name,
        is_public=complaint_in.is_public
    )
    db.add(complaint)
    db.flush()

    # 6. Save Evidence items
    for storage_key in complaint_in.evidence_storage_keys:
        evidence = ComplaintEvidence(
            complaint_id=complaint.id,
            storage_key=storage_key,
            evidence_type="INITIAL_REPORT",
            content_type="image/jpeg",
            file_size_bytes=1024,
            uploader_id=user.id
        )
        db.add(evidence)

    # 7. Record AI Analysis
    ai_record = AIAnalysis(
        complaint_id=complaint.id,
        model_provider=ai_result.analysis_mode,
        analysis_mode=ai_result.analysis_mode,
        structured_output=ai_result.model_dump(),
        confidence_score=ai_result.confidence_score,
        processing_status="SUCCESS"
    )
    db.add(ai_record)

    # 8. Record duplicate candidates
    for dup in ai_result.potential_duplicates:
        candidate_rec = DuplicateCandidate(
            source_complaint_id=complaint.id,
            candidate_complaint_id=dup["complaint_id"],
            distance_meters=dup["distance_meters"],
            similarity_score=dup["similarity_score"],
            status="DETECTED"
        )
        db.add(candidate_rec)

    # 9. Initial Timeline Update
    first_update = ComplaintUpdate(
        complaint_id=complaint.id,
        previous_status="NONE",
        new_status="SUBMITTED",
        public_comment="Complaint registered in system and queued for municipal review.",
        updated_by_id=user.id
    )
    db.add(first_update)

    db.commit()
    db.refresh(complaint)

    # 10. Audit log & Notifications
    record_audit_log(
        db=db,
        actor_user_id=user.id,
        action="CREATE_COMPLAINT",
        entity_type="COMPLAINT",
        entity_id=complaint.id,
        after_state={"reference_number": ref_num, "category": final_category, "severity": final_severity}
    )

    create_notification(
        db=db,
        recipient_user_id=user.id,
        complaint_id=complaint.id,
        notification_type="STATUS_CHANGE",
        title=f"Complaint #{ref_num} Submitted",
        message=f"Your complaint regarding '{complaint.title}' has been successfully filed."
    )

    return complaint

def transition_complaint_status(
    db: Session,
    complaint_id: str,
    status_change: ComplaintStatusChangeRequest,
    actor: User
) -> Complaint:
    """
    Executes a validated lifecycle status transition:
    SUBMITTED -> VERIFIED -> ASSIGNED -> IN_PROGRESS -> RESOLVED -> CITIZEN_VERIFIED
    (or REJECTED, REOPENED).
    """
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    old_status = complaint.status
    new_status = status_change.new_status

    # Validate transition
    allowed = ALLOWED_STATUS_TRANSITIONS.get(old_status, [])
    if new_status not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status transition from '{old_status}' to '{new_status}'. Allowed next states: {', '.join(allowed) if allowed else 'None (Terminal state)'}"
        )

    # Enforce mandatory reasons for Rejections or Reopenings
    if new_status in ["REJECTED", "REOPENED"] and not status_change.reason:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A mandatory explanation reason must be provided when transitioning to '{new_status}'."
        )

    # Permission checks: Citizens can only verify their own complaints or request reopen
    if actor.role == "CITIZEN":
        if complaint.user_id != actor.id:
            raise HTTPException(status_code=403, detail="Citizens can only verify or reopen their own complaints.")
        if new_status not in ["CITIZEN_VERIFIED", "REOPENED"]:
            raise HTTPException(status_code=403, detail="Citizens cannot advance complaints to municipal operational statuses.")

    # Apply changes
    now = datetime.now(timezone.utc)
    complaint.status = new_status

    if new_status == "RESOLVED":
        complaint.resolved_at = now
        complaint.resolution_notes = status_change.public_comment or "Resolved by municipal staff."
        # If resolution proof keys provided, save them
        if status_change.resolution_proof_keys:
            for key in status_change.resolution_proof_keys:
                proof = ComplaintEvidence(
                    complaint_id=complaint.id,
                    storage_key=key,
                    evidence_type="RESOLUTION_PROOF",
                    uploader_id=actor.id
                )
                db.add(proof)

    elif new_status == "CITIZEN_VERIFIED":
        complaint.citizen_verified_at = now

    # Record update timeline
    comment = status_change.public_comment
    if status_change.reason:
        comment = f"{status_change.reason}. {comment or ''}".strip()

    update_entry = ComplaintUpdate(
        complaint_id=complaint.id,
        previous_status=old_status,
        new_status=new_status,
        public_comment=comment,
        internal_note=status_change.internal_note,
        updated_by_id=actor.id
    )
    db.add(update_entry)

    db.commit()
    db.refresh(complaint)

    # Audit log
    record_audit_log(
        db=db,
        actor_user_id=actor.id,
        action="STATUS_CHANGE",
        entity_type="COMPLAINT",
        entity_id=complaint.id,
        before_state={"status": old_status},
        after_state={"status": new_status},
        reason=status_change.reason or status_change.public_comment
    )

    # Notifications
    if actor.id != complaint.user_id:
        create_notification(
            db=db,
            recipient_user_id=complaint.user_id,
            complaint_id=complaint.id,
            notification_type="STATUS_CHANGE",
            title=f"Complaint #{complaint.reference_number} Status Updated",
            message=f"Status changed from {old_status} to {new_status}. {comment or ''}"
        )

    return complaint

def assign_complaint(
    db: Session,
    complaint_id: str,
    assign_in: ComplaintAssignRequest,
    actor: User
) -> Complaint:
    """Assigns or reassigns a complaint to a department and/or officer."""
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    old_dept_id = complaint.department_id
    old_officer_id = complaint.assigned_officer_id
    old_status = complaint.status

    if assign_in.department_id:
        dept = db.query(Department).filter(Department.id == assign_in.department_id).first()
        if not dept:
            raise HTTPException(status_code=404, detail="Department not found")
        complaint.department_id = dept.id

    if assign_in.assigned_officer_id:
        officer = db.query(User).filter(User.id == assign_in.assigned_officer_id).first()
        if not officer or officer.role not in ["OFFICER", "ADMIN"]:
            raise HTTPException(status_code=400, detail="Invalid officer selected for assignment")
        complaint.assigned_officer_id = officer.id

    # Automatically advance to ASSIGNED if submitted or verified
    if complaint.status in ["SUBMITTED", "VERIFIED"]:
        complaint.status = "ASSIGNED"

    update_entry = ComplaintUpdate(
        complaint_id=complaint.id,
        previous_status=old_status,
        new_status=complaint.status,
        public_comment=f"Assigned to department staff. {assign_in.notes or ''}".strip(),
        internal_note=assign_in.notes,
        updated_by_id=actor.id
    )
    db.add(update_entry)
    db.commit()
    db.refresh(complaint)

    record_audit_log(
        db=db,
        actor_user_id=actor.id,
        action="ASSIGN_COMPLAINT",
        entity_type="COMPLAINT",
        entity_id=complaint.id,
        before_state={"department_id": old_dept_id, "officer_id": old_officer_id, "status": old_status},
        after_state={"department_id": complaint.department_id, "officer_id": complaint.assigned_officer_id, "status": complaint.status},
        reason=assign_in.notes
    )

    if complaint.assigned_officer_id:
        create_notification(
            db=db,
            recipient_user_id=complaint.assigned_officer_id,
            complaint_id=complaint.id,
            notification_type="ASSIGNMENT",
            title=f"New Assignment: #{complaint.reference_number}",
            message=f"You have been assigned to complaint '{complaint.title}' ({complaint.severity} priority)."
        )

    return complaint

def override_complaint(
    db: Session,
    complaint_id: str,
    override_in: ComplaintOverrideRequest,
    actor: User
) -> Complaint:
    """Allows municipal officers or admins to override AI recommendations with recorded justification."""
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    before_state = {
        "category": complaint.category,
        "severity": complaint.severity,
        "department_id": complaint.department_id
    }

    if override_in.category:
        complaint.category = override_in.category
    if override_in.severity:
        complaint.severity = override_in.severity
        complaint.severity_explanation = f"Manual officer override: {override_in.reason}"
    if override_in.department_id:
        complaint.department_id = override_in.department_id

    update_entry = ComplaintUpdate(
        complaint_id=complaint.id,
        previous_status=complaint.status,
        new_status=complaint.status,
        public_comment=f"Municipal review update: Categorization or severity revised.",
        internal_note=f"Override reason: {override_in.reason}",
        updated_by_id=actor.id
    )
    db.add(update_entry)
    db.commit()
    db.refresh(complaint)

    after_state = {
        "category": complaint.category,
        "severity": complaint.severity,
        "department_id": complaint.department_id
    }

    record_audit_log(
        db=db,
        actor_user_id=actor.id,
        action="OVERRIDE_AI_RECOMMENDATION",
        entity_type="COMPLAINT",
        entity_id=complaint.id,
        before_state=before_state,
        after_state=after_state,
        reason=override_in.reason
    )

    return complaint
