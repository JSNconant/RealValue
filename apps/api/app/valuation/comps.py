from __future__ import annotations

from datetime import date
from math import exp
from statistics import median
from typing import Iterable


def haversine_miles(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    from math import asin, cos, radians, sin, sqrt
    lat1, lon1, lat2, lon2 = map(radians, (lat1, lon1, lat2, lon2))
    dlat, dlon = lat2 - lat1, lon2 - lon1
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    return 3958.7613 * 2 * asin(sqrt(a))


def robust_weighted_median(points: Iterable[tuple[int, float]]) -> int:
    """Weighted median, with weights summing to 1 for a stable reconciliation estimate."""
    ordered = sorted((value, weight) for value, weight in points if weight > 0)
    total = sum(weight for _, weight in ordered)
    if not ordered or total <= 0:
        raise ValueError("No comparable points")
    cumulative = 0.0
    for value, weight in ordered:
        cumulative += weight
        if cumulative >= total / 2:
            return int(round(value))
    return int(round(ordered[-1][0]))


def local_similarity_weight(
    *, distance_miles: float | None, area_delta_ratio: float,
    age_delta_years: float, property_type_match: bool,
) -> float:
    """Unvalidated, interpretable demo ranking weights. Not calibrated coefficients."""
    if not property_type_match:
        return 0.0
    distance = 0.0 if distance_miles is None else distance_miles
    similarity = (
        1.0
        / (1.0 + 0.35 * distance)
        / (1.0 + 2.5 * area_delta_ratio)
        / (1.0 + 0.025 * abs(age_delta_years))
    )
    return max(0.05, min(1.0, similarity))


def apply_optional_time_factor(price_cents: int, factor: float | None) -> int:
    if factor is None:
        return price_cents
    if factor <= 0:
        raise ValueError("Time factor must be positive")
    return int(round(price_cents * exp(factor)))
