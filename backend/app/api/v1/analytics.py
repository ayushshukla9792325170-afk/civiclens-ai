from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.schemas import AnalyticsOverviewResponse
from app.repositories.analytics_repo import get_analytics_overview

router = APIRouter(prefix="/analytics", tags=["Analytics & Intelligence"])

@router.get("/overview", response_model=AnalyticsOverviewResponse)
def get_analytics(
    department_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Returns live municipal performance indicators, issue category breakdowns,
    severity counts, resolution durations, and hotspot coordinates.
    All data computed from actual database records.
    """
    return get_analytics_overview(db, department_id=department_id)
