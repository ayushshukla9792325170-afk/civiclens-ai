from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from app.services.ai.classifier import classify_text_category, extract_summary_and_keywords
from app.services.ai.severity import estimate_severity
from app.services.ai.routing import recommend_department
from app.services.ai.duplicate_detector import find_candidate_duplicates
from app.services.ai.vision import analyze_image_with_vision
from app.schemas.schemas import AIAnalysisResponse

def run_civic_ai_pipeline(
    db: Session,
    text_content: Optional[str] = None,
    image_storage_key: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None
) -> AIAnalysisResponse:
    """
    Coordinates modular AI inspection:
    1. Vision analysis on photo (Gemini Vision or deterministic heuristic)
    2. NLP text classification & extraction on description
    3. Severity recommendation with risk explanation
    4. Department routing
    5. Duplicate candidate scanning
    """
    analysis_mode = "RULE_BASED"
    confidence = 0.75
    detected_category = None
    visual_summary = None
    hazard_notes = ""

    # Step 1: Vision analysis if image provided
    if image_storage_key:
        vision_res = analyze_image_with_vision(image_storage_key, text_content)
        if vision_res.get("analysis_mode") == "AI_GEMINI":
            analysis_mode = "AI_GEMINI"
            confidence = vision_res.get("confidence", 0.88)
            detected_category = vision_res.get("category")
            visual_summary = vision_res.get("summary")
            hazard_notes = vision_res.get("hazard_notes", "")

    # Step 2: NLP text classification
    text = (text_content or "").strip()
    nlp_category, nlp_conf = classify_text_category(text)

    # Combine vision & NLP category
    if not detected_category:
        detected_category = nlp_category
        confidence = nlp_conf
    elif nlp_category != "OTHER" and nlp_category == detected_category:
        # Boost confidence if both agree
        confidence = min(0.96, confidence + 0.08)

    # Step 3: Summary generation
    nlp_summary, keywords = extract_summary_and_keywords(text) if text else ("Reported civic issue", [])
    if visual_summary and text:
        final_summary = f"{nlp_summary} Visual evidence: {visual_summary}"
    elif visual_summary:
        final_summary = visual_summary
    else:
        final_summary = nlp_summary

    # Suggested Title
    cat_readable = detected_category.replace("_", " ").title()
    suggested_title = f"{cat_readable} issue reported"
    if text:
        first_sentence = text.split(".")[0].strip()
        if len(first_sentence) > 5 and len(first_sentence) <= 60:
            suggested_title = first_sentence
        elif len(first_sentence) > 60:
            suggested_title = first_sentence[:57] + "..."

    # Step 4: Severity estimation
    severity, severity_expl, sev_conf = estimate_severity(detected_category, text)
    if hazard_notes:
        severity_expl += f" {hazard_notes}"

    # Step 5: Department recommendation
    _, dept_code, dept_name = recommend_department(detected_category, db)

    # Step 6: Duplicate detection if coordinates available
    duplicates: List[Dict[str, Any]] = []
    if latitude is not None and longitude is not None:
        duplicates = find_candidate_duplicates(
            db=db,
            latitude=latitude,
            longitude=longitude,
            category=detected_category,
            description=text
        )

    # Step 7: Recommended next step
    if severity == "CRITICAL":
        next_step = "High-priority alert: Immediate officer on-site dispatch and barricading required."
    elif duplicates:
        next_step = f"Potential duplicate flagged ({len(duplicates)} nearby reports). Review before assignment."
    else:
        next_step = f"Assign to {dept_name} for routine verification and work order creation."

    return AIAnalysisResponse(
        suggested_category=detected_category,
        suggested_title=suggested_title,
        short_summary=final_summary,
        suggested_severity=severity,
        severity_explanation=severity_expl,
        confidence_score=round(confidence, 2),
        suggested_department_code=dept_code,
        suggested_department_name=dept_name,
        potential_duplicates=duplicates,
        recommended_next_step=next_step,
        analysis_mode=analysis_mode,
        processing_status="SUCCESS"
    )
