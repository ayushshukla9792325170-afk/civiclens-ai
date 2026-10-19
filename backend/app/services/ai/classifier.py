import re
from typing import Dict, List, Tuple

CATEGORY_KEYWORDS: Dict[str, List[str]] = {
    "POTHOLE": ["pothole", "crater", "road hole", "pit", "cavity", "asphalt broken", "road depression", "bump", "uneven road"],
    "GARBAGE": ["garbage", "trash", "waste", "rubbish", "litter", "dump", "bin", "overflowing", "debris", "rotting"],
    "STREETLIGHT": ["streetlight", "street light", "lamp", "pole", "dark", "lighting", "bulb", "flickering", "blackout", "no light"],
    "DRAINAGE": ["drain", "drainage", "sewer", "gutter", "waterlogging", "clogged drain", "overflowing drain", "manhole", "open drain"],
    "ROAD_DAMAGE": ["road damage", "crack", "pavement", "broken road", "footpath", "sidewalk", "divider broken", "tar peeled"],
    "DAMAGED_SIGN": ["sign", "signboard", "traffic sign", "signal", "traffic light", "stop sign", "direction board", "broken pole"],
    "WATER_LEAKAGE": ["leak", "leakage", "water pipe", "pipeline burst", "gushing water", "drinking water wasted", "valve burst"],
    "ILLEGAL_DUMPING": ["illegal dumping", "debris dumped", "construction waste", "debris", "hazardous waste", "unauthorized dump"]
}

def classify_text_category(text: str) -> Tuple[str, float]:
    """
    Classifies issue text into a civic category using keyword density and scoring.
    Returns (category, confidence).
    """
    if not text:
        return "OTHER", 0.40

    lower_text = text.lower()
    scores: Dict[str, int] = {cat: 0 for cat in CATEGORY_KEYWORDS}

    for cat, keywords in CATEGORY_KEYWORDS.items():
        for kw in keywords:
            if re.search(r'\b' + re.escape(kw) + r'\b', lower_text):
                scores[cat] += 2
            elif kw in lower_text:
                scores[cat] += 1

    best_cat = max(scores, key=scores.get)
    max_score = scores[best_cat]

    if max_score == 0:
        return "OTHER", 0.45

    # Confidence calculation normalized
    confidence = min(0.92, 0.55 + (max_score * 0.1))
    return best_cat, round(confidence, 2)

def extract_summary_and_keywords(text: str, max_words: int = 25) -> Tuple[str, List[str]]:
    """
    Extracts a concise civic issue summary and key descriptors.
    """
    clean_text = " ".join(text.strip().split())
    words = clean_text.split()
    summary = " ".join(words[:max_words])
    if len(words) > max_words:
        summary += "..."

    # Extract keywords
    lower = clean_text.lower()
    found_keywords = set()
    for cat_keywords in CATEGORY_KEYWORDS.values():
        for kw in cat_keywords:
            if kw in lower:
                found_keywords.add(kw)

    return summary, sorted(list(found_keywords))
