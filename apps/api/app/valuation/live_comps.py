from __future__ import annotations

from datetime import date, datetime
from typing import Iterable

from .comps import haversine_miles, local_similarity_weight, robust_weighted_median


SUPPORTED_PROPERTY_TYPES = {"Single Family", "Townhouse", "Condo"}


def parse_iso_date(value: object) -> date | None:
    if not isinstance(value, str) or not value.strip():
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).date()
    except ValueError:
        return None


def positive_number(value: object) -> float | None:
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        return float(value) if value > 0 else None
    if isinstance(value, str):
        try:
            number = float(value.replace("$", "").replace(",", ""))
            return number if number > 0 else None
        except ValueError:
            return None
    return None


def build_live_comparable_indicator(
    subject: dict,
    records: Iterable[dict],
    as_of: date,
) -> dict:
    """Build an evidence-preserving experimental sales-comparison indicator.

    This is intentionally not a calibrated valuation: it has no fitted local coefficients,
    market-time index, or predictive interval. It exposes only attributable closed-sale
    records supplied by the provider and clearly marks them experimental.
    """
    subject_type = subject.get("propertyType")
    if subject_type not in SUPPORTED_PROPERTY_TYPES:
        return {
            "status": "unsupported_property",
            "estimate_cents": None,
            "selected": [],
            "excluded": [],
            "warnings": [f"Property type {subject_type or 'missing'} is not in the initial supported pilot set"],
        }

    subject_area = positive_number(subject.get("squareFootage"))
    subject_year = positive_number(subject.get("yearBuilt"))
    subject_lat = positive_number(subject.get("latitude"))
    subject_lon = positive_number(subject.get("longitude"))

    if subject_area is None:
        return {
            "status": "insufficient_evidence",
            "estimate_cents": None,
            "selected": [],
            "excluded": [],
            "warnings": ["Subject living area is missing; an attributable indicator cannot be calculated safely"],
        }

    selected: list[dict] = []
    excluded: list[dict] = []

    for record in records:
        record_id = str(record.get("id") or "")
        address = str(record.get("formattedAddress") or record.get("address") or "")
        if record_id and record_id == subject.get("id"):
            excluded.append({"address": address, "record_id": record_id, "reason": "subject_property"})
            continue

        sale_price = positive_number(record.get("lastSalePrice"))
        sale_date = parse_iso_date(record.get("lastSaleDate"))
        if sale_price is None:
            excluded.append({"address": address, "record_id": record_id, "reason": "missing_positive_sale_price"})
            continue
        if sale_date is None:
            excluded.append({"address": address, "record_id": record_id, "reason": "missing_sale_date"})
            continue
        if sale_date > as_of:
            excluded.append({"address": address, "record_id": record_id, "reason": "sale_after_valuation_date"})
            continue
        if (as_of - sale_date).days > 365:
            excluded.append({"address": address, "record_id": record_id, "reason": "older_than_365_days"})
            continue
        if record.get("propertyType") != subject_type:
            excluded.append({"address": address, "record_id": record_id, "reason": "property_type_mismatch"})
            continue

        comp_area = positive_number(record.get("squareFootage"))
        if comp_area is None:
            excluded.append({"address": address, "record_id": record_id, "reason": "missing_living_area"})
            continue
        area_ratio = abs(comp_area - subject_area) / subject_area
        if comp_area < subject_area * 0.60 or comp_area > subject_area * 1.40:
            excluded.append({"address": address, "record_id": record_id, "reason": "living_area_outside_hard_filter"})
            continue

        comp_lat = positive_number(record.get("latitude"))
        comp_lon = positive_number(record.get("longitude"))
        distance = None
        if subject_lat is not None and subject_lon is not None and comp_lat is not None and comp_lon is not None:
            distance = haversine_miles(subject_lat, subject_lon, comp_lat, comp_lon)
            if distance > 10:
                excluded.append({"address": address, "record_id": record_id, "reason": "distance_over_10_miles"})
                continue

        comp_year = positive_number(record.get("yearBuilt"))
        age_delta = 0.0 if subject_year is None or comp_year is None else float(comp_year - subject_year)
        lot_delta_ratio = 0.0
        subject_lot = positive_number(subject.get("lotSize"))
        comp_lot = positive_number(record.get("lotSize"))
        if subject_lot is not None and comp_lot is not None:
            lot_delta_ratio = abs(comp_lot - subject_lot) / subject_lot

        zip_match = bool(subject.get("zipCode") and record.get("zipCode") == subject.get("zipCode"))
        weight = local_similarity_weight(
            distance_miles=distance,
            area_delta_ratio=area_ratio,
            age_delta_years=age_delta,
            property_type_match=True,
        )
        if zip_match:
            weight *= 1.15
        if lot_delta_ratio > 0.50:
            weight *= 0.90

        days_old = max(0, (as_of - sale_date).days)
        recency_factor = 1.0 / (1.0 + 0.0015 * days_old)
        weight *= recency_factor

        selected.append({
            "address": address,
            "record_id": record_id,
            "distance_miles": distance,
            "sale_date": sale_date,
            "sale_price_cents": int(round(sale_price * 100)),
            "living_area_sqft": comp_area,
            "bedrooms": positive_number(record.get("bedrooms")),
            "bathrooms": positive_number(record.get("bathrooms")),
            "lot_area_sqft": comp_lot,
            "year_built": int(comp_year) if comp_year is not None else None,
            "weight_raw": weight,
            "provider_record": record,
        })

    if len(selected) < 3:
        return {
            "status": "insufficient_evidence",
            "estimate_cents": None,
            "selected": selected,
            "excluded": excluded,
            "warnings": [f"Only {len(selected)} qualifying attributable closed-sale records were found; at least 3 are required"],
        }

    total_weight = sum(item["weight_raw"] for item in selected)
    normalized = []
    for item in selected:
        item = dict(item)
        item["weight"] = round(item["weight_raw"] / total_weight, 6)
        item.pop("provider_record", None)
        normalized.append(item)

    points = [(item["sale_price_cents"], item["weight_raw"] / total_weight) for item in selected]
    estimate_cents = robust_weighted_median(points)
    raw_prices = [item["sale_price_cents"] for item in selected]

    return {
        "status": "experimental_market_indicator",
        "estimate_cents": estimate_cents,
        "spread_low_cents": min(raw_prices),
        "spread_high_cents": max(raw_prices),
        "selected": normalized,
        "excluded": excluded,
        "warnings": [
            "No fitted local hedonic coefficients are available",
            "No sourced market-time index was applied",
            "Provider sale records do not establish arm's-length status or concessions from this prototype alone",
            "Comparable spread is descriptive, not a calibrated predictive interval",
            "No 5% accuracy claim",
        ],
    }
