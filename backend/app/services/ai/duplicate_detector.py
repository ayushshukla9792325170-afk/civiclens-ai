import re
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.models.models import Complaint
from app.services.geospatial.geo import calculate_haversine_distance
from app.core.config import settings

def tokenize_text(text: str) -> set:
    words = re.findall(r'\b[a-z]{3,}\b', text.lower())
    stopwords = {"the", "and", "for", "with", "from", "near", "road", "street", "area", "please", "this", "that", "there"}
    return {w for w in words if w not in stopwords}

def calculate_text_similarity(text1: str, text2: str) -> float:
    """Calculates Jaccard token similarity between two text snippets."""
    tokens1 = tokenize_text(text1)
    tokens2 = tokenize_text(text2)
    if not tokens1 or not tokens2:
        return 0.0
    intersection = tokens1.intersection(tokens2)
    union = tokens1.union(tokens2)
    return round(len(intersection) / len(union), 2)

def find_candidate_duplicates(
    db: Session,
    latitude: float,
    longitude: float,
    category: str,
    description: str,
    exclude_id: Optional[str] = None,
    distance_threshold: float = settings.DUPLICATE_DISTANCE_THRESHOLD_METERS
) -> List[Dict[str, Any]]:
    """
    Scans recent complaints within distance_threshold and calculates category
    match and textual similarity to identify potential duplicate reports.
    """
    cutoff_date = datetime.now(timezone.utc) - timedelta(days=settings.DUPLICATE_TIME_WINDOW_DAYS)
    
    # Query non-resolved or recently created complaints
    query = db.query(Complaint).filter(Complaint.created_at >= cutoff_date)
    if exclude_id:
        query = query.filter(Complaint.id != exclude_id)
    
    candidates = query.all()
    results = []

    for comp in candidates:
        dist = calculate_haversine_distance(latitude, longitude, comp.latitude, comp.longitude)
        if dist <= distance_threshold:
            text_sim = calculate_text_similarity(description, comp.description)
            is_same_cat = (comp.category == category)

            # Score formula: 50% distance proximity + 30% category match + 20% text similarity
            dist_score = max(0.0, 1.0 - (dist / distance_threshold))
            cat_score = 1.0 if is_same_cat else 0.0
            overall_score = round((dist_score * 0.5) + (cat_score * 0.3) + (text_sim * 0.2), 2)

            if is_same_cat or text_sim >= 0.25 or dist <= 50.0:
                results.append({
                    "complaint_id": comp.id,
                    "reference_number": comp.reference_number,
                    "title": comp.title,
                    "category": comp.category,
                    "status": comp.status,
                    "distance_meters": dist,
                    "similarity_score": overall_score,
                    "created_at": comp.created_at.isoformat()
                })

    # Sort candidates by similarity score descending
    results.sort(key=lambda x: x["similarity_score"], reverse=True)
    return results[:5]
