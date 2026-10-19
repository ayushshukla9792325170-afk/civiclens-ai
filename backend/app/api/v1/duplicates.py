from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import DuplicateCandidate, Complaint, User
from app.schemas.schemas import DuplicateCandidateResponse, DuplicateReviewRequest
from app.core.permissions import require_officer
from app.utils.audit import record_audit_log

router = APIRouter(prefix="/duplicates", tags=["Duplicate Detection"])

@router.get("/{complaint_id}", response_model=List[DuplicateCandidateResponse])
def get_duplicates_for_complaint(
    complaint_id: str,
    user: User = Depends(require_officer),
    db: Session = Depends(get_db)
):
    """Retrieves all duplicate candidates detected for a given complaint."""
    candidates = db.query(DuplicateCandidate).filter(
        DuplicateCandidate.source_complaint_id == complaint_id
    ).all()

    responses = []
    for cand in candidates:
        target = cand.candidate_complaint
        if target:
            responses.append(
                DuplicateCandidateResponse(
                    id=cand.id,
                    source_complaint_id=cand.source_complaint_id,
                    candidate_complaint_id=cand.candidate_complaint_id,
                    candidate_reference=target.reference_number,
                    candidate_title=target.title,
                    candidate_category=target.category,
                    candidate_status=target.status,
                    candidate_created_at=target.created_at,
                    distance_meters=cand.distance_meters,
                    similarity_score=cand.similarity_score,
                    status=cand.status,
                    review_reason=cand.review_reason,
                    created_at=cand.created_at
                )
            )
    return responses

@router.put("/{candidate_id}/review")
def review_duplicate_candidate(
    candidate_id: str,
    review_in: DuplicateReviewRequest,
    user: User = Depends(require_officer),
    db: Session = Depends(get_db)
):
    """
    Officer review of a duplicate candidate (CONFIRMED_DUPLICATE or DISMISSED)
    with mandatory explanation.
    """
    candidate = db.query(DuplicateCandidate).filter(DuplicateCandidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Duplicate candidate record not found.")

    old_status = candidate.status
    candidate.status = review_in.status
    candidate.reviewed_by_id = user.id
    candidate.review_reason = review_in.review_reason

    db.commit()
    db.refresh(candidate)

    record_audit_log(
        db=db,
        actor_user_id=user.id,
        action="REVIEW_DUPLICATE_CANDIDATE",
        entity_type="DUPLICATE_CANDIDATE",
        entity_id=candidate.id,
        before_state={"status": old_status},
        after_state={"status": candidate.status},
        reason=review_in.review_reason
    )

    return {"message": f"Duplicate candidate marked as '{candidate.status}'.", "id": candidate.id}
