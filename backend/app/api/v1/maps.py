from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import Complaint, Ward, User
from app.core.permissions import get_current_user_optional

router = APIRouter(prefix="/maps", tags=["Geospatial & Maps"])

@router.get("/geojson")
def get_complaints_geojson(
    status: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    Returns complaints formatted as a GeoJSON FeatureCollection for Leaflet.
    For non-officer users, reporter identity is redacted and only public items are returned.
    """
    query = db.query(Complaint)
    is_staff = user and user.role in ["OFFICER", "ADMIN"]

    if not is_staff:
        query = query.filter(Complaint.is_public == True)

    if status:
        query = query.filter(Complaint.status == status)
    if category:
        query = query.filter(Complaint.category == category)
    if severity:
        query = query.filter(Complaint.severity == severity)

    complaints = query.all()
    features = []

    for c in complaints:
        primary_evidence = c.evidence_items[0].storage_key if c.evidence_items else None
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [c.longitude, c.latitude]
            },
            "properties": {
                "id": c.id,
                "reference_number": c.reference_number,
                "title": c.title,
                "category": c.category,
                "severity": c.severity,
                "status": c.status,
                "address": c.address,
                "ward_name": c.ward_name,
                "created_at": c.created_at.isoformat(),
                "primary_evidence": primary_evidence,
                "reporter_name": c.reporter.name if (is_staff and c.reporter) else "Citizen"
            }
        })

    return {
        "type": "FeatureCollection",
        "features": features
    }

@router.get("/wards-geojson")
def get_wards_geojson(db: Session = Depends(get_db)):
    """Returns ward centers and approximate coverage buffers for interactive map overlay."""
    wards = db.query(Ward).all()
    features = []
    for w in wards:
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [w.center_longitude, w.center_latitude]
            },
            "properties": {
                "id": w.id,
                "name": w.name,
                "code": w.code,
                "city": w.city,
                "radius_meters": w.radius_meters
            }
        })
    return {
        "type": "FeatureCollection",
        "features": features
    }
