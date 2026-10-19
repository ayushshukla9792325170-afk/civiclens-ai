from typing import Tuple

CRITICAL_TRIGGERS = [
    "open manhole", "manhole open", "exposed wire", "live wire", "electric shock",
    "cave-in", "collapsed road", "sinkhole", "deep crater", "accident",
    "hazardous", "toxic", "chemical spill", "hospital", "school gate", "danger to life"
]

HIGH_TRIGGERS = [
    "pipeline burst", "gushing water", "major waterlogging", "flooding", "blackout",
    "traffic signal down", "major junction", "main road", "highway", "bus stop",
    "sewer overflow", "choked main drain", "fallen pole", "pedestrian hazard"
]

LOW_TRIGGERS = [
    "minor", "small crack", "faded", "scratched", "paint peeling", "graffiti",
    "corner litter", "dry leaves", "aesthetic"
]

def estimate_severity(category: str, description: str) -> Tuple[str, str, float]:
    """
    Evaluates civic risk and returns (severity, explanation, confidence).
    Severities: LOW, MEDIUM, HIGH, CRITICAL.
    """
    lower = description.lower()
    
    # 1. Critical checks
    for trigger in CRITICAL_TRIGGERS:
        if trigger in lower:
            return (
                "CRITICAL",
                f"Flagged as CRITICAL due to severe public safety hazard detected: '{trigger}'. Immediate human review recommended.",
                0.90
            )

    # 2. High risk checks
    for trigger in HIGH_TRIGGERS:
        if trigger in lower:
            return (
                "HIGH",
                f"Elevated to HIGH priority due to significant public disruption or risk trigger: '{trigger}'.",
                0.85
            )

    # 3. Category defaults
    if category in ["DRAINAGE", "WATER_LEAKAGE"]:
        return (
            "HIGH",
            "Assessed as HIGH severity due to potential sanitation contamination and water resource loss.",
            0.78
        )
    elif category in ["POTHOLE", "ROAD_DAMAGE", "STREETLIGHT"]:
        # Check if minor
        for low_trig in LOW_TRIGGERS:
            if low_trig in lower:
                return (
                    "LOW",
                    f"Assessed as LOW severity due to non-acute indication: '{low_trig}'.",
                    0.80
                )
        return (
            "MEDIUM",
            "Assessed as MEDIUM severity standard infrastructure repair requirement.",
            0.82
        )
    elif category in ["GARBAGE", "ILLEGAL_DUMPING", "DAMAGED_SIGN"]:
        for low_trig in LOW_TRIGGERS:
            if low_trig in lower:
                return ("LOW", f"Assessed as LOW severity routine cleanup item: '{low_trig}'.", 0.80)
        return (
            "MEDIUM",
            "Assessed as MEDIUM severity standard municipal clearance requirement.",
            0.80
        )

    return (
        "LOW",
        "Assessed as LOW severity standard civic maintenance observation.",
        0.70
    )
