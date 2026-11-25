from __future__ import annotations

import json
import uuid
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

import httpx
from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .providers.rentcast import RentCastProvider
from .schemas import AddressSearchRequest, Comparable, EstimateStatus, Evidence, Valuation, ValuationRequest
from .valuation.comps import local_similarity_weight, robust_weighted_median
from .valuation.live_comps import build_live_comparable_indicator

app = FastAPI(title="RealValue API", version="0.1.0")

origins = []
for origin in settings.cors_allowed_origins.split(","):
    origin = origin.strip()
    if origin and not origin.startswith(("http://", "https://")):
        origin = f"https://{origin}"
    if origin:
        origins.append(origin)
origin_regex = settings.cors_allowed_origin_regex.strip() if settings.cors_allowed_origin_regex.strip() else None
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=origin_regex,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Accept"],
)

FIXTURE_PATH = Path(__file__).resolve().parents[1] / "fixtures" / "demo_property.json"
valuation_cache: dict[str, tuple[datetime, dict]] = {}


def _normalize_address(value: str) -> str:
    return " ".join(value.strip().lower().split())


def _valuation_cache_key(*, address: str, as_of: date, demo: bool) -> str:
    mode = "demo" if demo else "live"
    return f"{mode}:{as_of.isoformat()}:{_normalize_address(address)}"


def _cache_get(key: str) -> dict | None:
    cached = valuation_cache.get(key)
    if not cached:
        return None
    expires_at, payload = cached
    if expires_at <= datetime.now(timezone.utc):
        valuation_cache.pop(key, None)
        return None
    return payload


def _cache_set(key: str, payload: dict) -> None:
    ttl = max(0, settings.valuation_cache_ttl_seconds)
    if ttl == 0:
        return
    max_entries = max(1, settings.valuation_cache_max_entries)
    if len(valuation_cache) >= max_entries:
        oldest_key = min(valuation_cache.items(), key=lambda item: item[1][0])[0]
        valuation_cache.pop(oldest_key, None)
    valuation_cache[key] = (datetime.now(timezone.utc) + timedelta(seconds=ttl), payload)


@app.get("/healthz")
def healthz():
    return {"status": "ok", "service": "realvalue-api"}


@app.get("/readyz")
def readyz():
    live_ready = bool(settings.rentcast_api_key) and settings.enable_live_valuations
    return {
        "status": "ready",
        "live_provider_ready": live_ready,
        "demo_ready": settings.enable_demo_mode,
        "cors_allowed_origins": origins,
        "cors_allowed_origin_regex": origin_regex,
        "valuation_cache_ttl_seconds": settings.valuation_cache_ttl_seconds,
        "valuation_cache_entries": len(valuation_cache),
    }


@app.post("/api/v1/address/search")
async def address_search(payload: AddressSearchRequest):
    if not settings.rentcast_api_key:
        if settings.enable_demo_mode:
            return {"matches": [{"address": "123 Fictional Ave, Austin, TX 78704", "provider_id": "FIXTURE-AUSTIN-001", "demo": True}]}
        return {"matches": []}

    provider = RentCastProvider(settings.rentcast_api_key, settings.provider_request_timeout_seconds)
    try:
        records = await provider.search_properties(payload.q)
    except httpx.HTTPStatusError as exc:
        raise HTTPException(status_code=502, detail={"code": "provider_error", "message": "Property provider request failed", "status": exc.response.status_code})
    except httpx.RequestError:
        raise HTTPException(status_code=503, detail={"code": "provider_unavailable", "message": "Property provider is unavailable"})
    return {"matches": [{"address": r.get("formattedAddress"), "provider_id": r.get("id"), "demo": False} for r in records]}


def _demo_valuation(address: str, as_of: date) -> Valuation:
    data = json.loads(FIXTURE_PATH.read_text())
    now = datetime.now(timezone.utc)
    evidence: list[Evidence] = []
    comparables: list[Comparable] = []
    subject = data["property"]

    evidence.append(Evidence(
        evidence_id="E-FIXTURE-SUBJECT",
        provider="RealValue fixture",
        record_id=subject["id"],
        field="subject_property_snapshot",
        value="Fictional single-family subject; not a real property",
        retrieved_at=now,
        observed_at=as_of,
        confidence_status="fixture_unverified",
    ))

    points: list[tuple[int, float]] = []
    for index, comp in enumerate(data["comparables"], start=1):
        eid = f"E-FIXTURE-C{index}"
        evidence.append(Evidence(
            evidence_id=eid,
            provider="RealValue fixture",
            record_id=comp["id"],
            field="fixture_closed_sale",
            value=f"Fictional sale price {comp['salePrice']}, sale date {comp['saleDate']}",
            retrieved_at=now,
            observed_at=date.fromisoformat(comp["saleDate"]),
            confidence_status="fixture_unverified",
        ))
        area_delta = abs(comp["squareFootage"] - subject["squareFootage"]) / subject["squareFootage"]
        age_delta = float(comp["yearBuilt"] - subject["yearBuilt"])
        weight = local_similarity_weight(
            distance_miles=comp["distanceMiles"],
            area_delta_ratio=area_delta,
            age_delta_years=age_delta,
            property_type_match=True,
        )
        points.append((comp["salePrice"] * 100, weight))
        comparables.append(Comparable(
            address=comp["address"],
            distance_miles=comp["distanceMiles"],
            transaction_date=date.fromisoformat(comp["saleDate"]),
            sale_price_cents=comp["salePrice"] * 100,
            living_area_sqft=comp["squareFootage"],
            bedrooms=comp["bedrooms"],
            bathrooms=comp["bathrooms"],
            lot_area_sqft=comp["lotSize"],
            year_built=comp["yearBuilt"],
            adjusted_price_cents=comp["salePrice"] * 100,
            weight=0.0,
            evidence_ids=[eid],
        ))

    total_weight = sum(weight for _, weight in points)
    if total_weight > 0:
        for comparable, (_, weight) in zip(comparables, points):
            comparable.weight = round(weight / total_weight, 6)

    estimate = robust_weighted_median(points)
    explanation = (
        f"This is a fictional demonstration, not a property valuation. The illustrative comparison uses "
        f"{len(comparables)} synthetic closed sales and an unvalidated similarity-weighted median. "
        f"No market-time index, condition adjustment, or predictive interval was calibrated. "
        f"No conclusion should be drawn about an actual Austin property."
    )
    return Valuation(
        run_id=f"demo-{uuid.uuid4()}",
        estimate_status=EstimateStatus.EXPERIMENTAL_MARKET_INDICATOR,
        estimate_cents=estimate,
        as_of_date=as_of,
        model_version="fixture-comps-v0.1",
        data_snapshot_version="fixture-2026-11-22",
        address=address,
        property_facts=subject,
        comparables=comparables,
        warnings=["Fictional data only", "No calibrated uncertainty interval", "No sourced time adjustment"],
        assumptions=["Raw synthetic sale prices are not adjusted for market time or condition", "Similarity weights are demonstration defaults, not fitted coefficients"],
        sources=evidence,
        explanation=explanation,
        disclaimers=["DEMO — NOT A LIVE VALUATION", "Experimental estimate, not an appraisal or offer", "No 5% accuracy claim"],
    )


@app.post("/api/v1/valuations")
async def valuation(payload: ValuationRequest):
    as_of = payload.as_of_date or date.today()
    cache_key = _valuation_cache_key(address=payload.address, as_of=as_of, demo=payload.demo)
    cached_payload = _cache_get(cache_key)
    if cached_payload is not None:
        return cached_payload

    if payload.demo:
        if not settings.enable_demo_mode:
            raise HTTPException(status_code=404, detail={"code": "demo_disabled", "message": "Demo mode is disabled"})
        response = _demo_valuation(payload.address, as_of).model_dump(mode="json")
        _cache_set(cache_key, response)
        return response

    if not settings.enable_live_valuations or not settings.rentcast_api_key:
        raise HTTPException(status_code=503, detail={
            "code": "live_valuation_disabled",
            "message": "Live valuation is disabled until a provider key is configured and a validated model is activated",
        })

    provider = RentCastProvider(settings.rentcast_api_key, settings.provider_request_timeout_seconds)
    try:
        records = await provider.search_properties(payload.address)
        comps = await provider.search_sold_comps(payload.address)
    except httpx.HTTPStatusError as exc:
        raise HTTPException(status_code=502, detail={"code": "provider_error", "message": "Provider lookup failed", "status": exc.response.status_code})
    except httpx.RequestError:
        raise HTTPException(status_code=503, detail={"code": "provider_unavailable", "message": "Property provider is unavailable"})

    if not records:
        raise HTTPException(status_code=404, detail={"code": "address_not_found", "message": "No attributable property record was found"})

    subject = records[0]
    now = datetime.now(timezone.utc)
    subject_evidence = Evidence(
        evidence_id="E-SUBJECT-1",
        provider="RentCast",
        record_id=subject.get("id"),
        field="property_record",
        value=subject.get("formattedAddress", payload.address),
        retrieved_at=now,
        observed_at=as_of,
        source_url="https://developers.rentcast.io/reference/property-records",
        source_url_label="provider_documentation",
        confidence_status="provider_reported",
    )

    qualifying = build_live_comparable_indicator(subject, comps, as_of)

    sources = [subject_evidence]
    comparable_items: list[Comparable] = []
    for index, item in enumerate(qualifying["selected"], start=1):
        evidence_id = f"E-COMP-{index}"
        sources.append(Evidence(
            evidence_id=evidence_id,
            provider="RentCast",
            record_id=item.get("record_id") or None,
            field="last_sale_record",
            value=f"Provider-reported sale of {item['sale_price_cents'] / 100:,.2f} USD on {item['sale_date'].isoformat()}",
            retrieved_at=now,
            observed_at=item["sale_date"],
            source_url="https://developers.rentcast.io/reference/property-records",
            source_url_label="provider_documentation",
            confidence_status="provider_reported",
        ))
        comparable_items.append(Comparable(
            address=item["address"],
            distance_miles=item["distance_miles"],
            transaction_date=item["sale_date"],
            sale_price_cents=item["sale_price_cents"],
            living_area_sqft=item["living_area_sqft"],
            bedrooms=item["bedrooms"],
            bathrooms=item["bathrooms"],
            lot_area_sqft=item["lot_area_sqft"],
            year_built=item["year_built"],
            adjusted_price_cents=item["sale_price_cents"],
            weight=item["weight"],
            evidence_ids=[evidence_id],
        ))

    result_status = qualifying["status"]
    if result_status == "unsupported_property":
        estimate_status = EstimateStatus.UNSUPPORTED_PROPERTY
    elif result_status == "insufficient_evidence":
        estimate_status = EstimateStatus.INSUFFICIENT_EVIDENCE
    else:
        estimate_status = EstimateStatus.EXPERIMENTAL_MARKET_INDICATOR

    if estimate_status == EstimateStatus.EXPERIMENTAL_MARKET_INDICATOR:
        selected_count = len(comparable_items)
        explanation = (
            f"This is an unvalidated experimental sales-comparison indicator based on "
            f"{selected_count} provider-reported closed-sale records. The current estimate reconciles "
            f"their raw transaction prices using transparent location, living-area, age, lot-size, "
            f"ZIP, and recency weights. No market-time index or fitted structural coefficient was applied, "
            f"and the provider records do not independently establish arm's-length status or concessions. "
            f"This is not a calibrated market value or appraisal."
        )
        disclaimers = ["EXPERIMENTAL — NOT VALIDATED", "Experimental estimate, not an appraisal or offer", "No 5% accuracy claim"]
    elif estimate_status == EstimateStatus.INSUFFICIENT_EVIDENCE:
        explanation = "Insufficient attributable comparable-sale evidence is available for a defensible estimate. Property facts are shown where the provider supplied them."
        disclaimers = ["NO VALUATION REPORTED", "Experimental estimate, not an appraisal", "No 5% accuracy claim"]
    else:
        explanation = "The subject property type is outside the initial supported residential sales-comparison scope."
        disclaimers = ["PROPERTY TYPE NOT SUPPORTED", "Experimental estimate, not an appraisal", "No 5% accuracy claim"]

    response = Valuation(
        run_id=f"live-{uuid.uuid4()}",
        estimate_status=estimate_status,
        estimate_cents=qualifying["estimate_cents"],
        as_of_date=as_of,
        model_version="rentcast-sales-comparison-v0.1",
        data_snapshot_version=f"rentcast-provider-{now.date().isoformat()}",
        address=subject.get("formattedAddress", payload.address),
        property_facts=subject,
        comparables=comparable_items,
        excluded_comparables=qualifying["excluded"],
        warnings=qualifying["warnings"],
        assumptions=[
            "Raw provider-reported sale prices are not adjusted with invented dollar coefficients",
            "Comparable distance, area, age, lot, ZIP, and recency weights are unvalidated defaults",
            "A comparable price spread is descriptive and is not a predictive interval",
        ],
        sources=sources,
        explanation=explanation,
        disclaimers=disclaimers,
    ).model_dump(mode="json")
    _cache_set(cache_key, response)
    return response


@app.get("/api/v1/valuations/{run_id}")
async def get_valuation(run_id: str):
    raise HTTPException(status_code=404, detail={"code": "run_not_persisted", "message": "Runs are not persisted in this prototype; use the POST response as a synchronous snapshot"})
