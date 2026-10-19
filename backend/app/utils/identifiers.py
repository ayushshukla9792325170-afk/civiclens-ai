import random
from datetime import datetime, timezone

def generate_complaint_reference() -> str:
    """
    Generates a unique, professional human-readable complaint reference.
    Example: CLN-2026-7842
    """
    year = datetime.now(timezone.utc).year
    rand_num = random.randint(1000, 9999)
    return f"CLN-{year}-{rand_num}"
