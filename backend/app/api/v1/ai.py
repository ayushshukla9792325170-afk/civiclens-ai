from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.schemas import AIAnalysisRequest, AIAnalysisResponse
from app.services.ai.orchestrator import run_civic_ai_pipeline
from app.core.config import settings

router = APIRouter(prefix="/ai", tags=["AI Intelligence"])

@router.post("/analyze", response_model=AIAnalysisResponse)
def analyze_civic_report(
    payload: AIAnalysisRequest,
    db: Session = Depends(get_db)
):
    """
    Executes the modular civic intelligence pipeline:
    - Vision inference (Gemini 1.5 Flash or deterministic heuristic)
    - NLP extraction & category identification
    - Severity risk scoring with human-readable rationale
    - Municipal department routing
    - Duplicate complaint detection
    """
    result = run_civic_ai_pipeline(
        db=db,
        text_content=payload.text_content,
        image_storage_key=payload.image_storage_key,
        latitude=payload.latitude,
        longitude=payload.longitude
    )
    return result

@router.get("/status")
def get_ai_status():
    """
    Returns AI provider operational status without exposing secret API keys.
    """
    has_gemini = bool(settings.GEMINI_API_KEY and len(settings.GEMINI_API_KEY) > 5)
    return {
        "active_mode": "AI_GEMINI" if has_gemini else "RULE_BASED",
        "vision_provider": "Google Gemini 1.5 Flash" if has_gemini else "Rule-based Inspector Heuristic",
        "nlp_provider": "CivicLens Keyword & Density Classifier",
        "severity_engine": "CivicLens Risk Matrix Engine",
        "duplicate_detection": "Haversine Distance + Token Similarity",
        "gemini_configured": has_gemini
    }
