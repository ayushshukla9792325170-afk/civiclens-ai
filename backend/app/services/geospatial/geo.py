import math
from typing import List, Optional, Tuple
from app.models.models import Ward

def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculates the great-circle distance between two points on the Earth
    in meters using the Haversine formula.
    """
    # Earth radius in meters
    R = 6371000.0

    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2)
    
    # Avoid numerical precision errors where a might slightly exceed 1.0
    a = min(1.0, max(0.0, a))
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

    distance = R * c
    return round(distance, 2)

def find_nearest_ward(lat: float, lon: float, wards: List[Ward]) -> Optional[Tuple[Ward, float]]:
    """
    Finds the nearest ward to the given coordinates among available wards.
    Returns (Ward, distance_in_meters) or None.
    """
    if not wards:
        return None

    best_ward = None
    min_dist = float("inf")

    for ward in wards:
        dist = calculate_haversine_distance(lat, lon, ward.center_latitude, ward.center_longitude)
        if dist < min_dist:
            min_dist = dist
            best_ward = ward

    if best_ward:
        return best_ward, min_dist
    return None
