from __future__ import annotations

import json
import uuid
from datetime import date, datetime, timezone
from pathlib import Path

import httpx
from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .providers.rentcast import RentCastProvider
from .schemas import AddressSearchRequest, Comparable, EstimateStatus, Evidence, Valuation, ValuationRequest
from .valuation.comps import local_similarity_weight, robust_weighted_median

app = FastAPI(title="RealValue API", version="0.1.0")

origins = [origin.strip() for origin in settings.cors_allowed_origins.split(",") if origin.strip()]
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
    if payload.demo:
        if not settings.enable_demo_mode:
            raise HTTPException(status_code=404, detail={"code": "demo_disabled", "message": "Demo mode is disabled"})
        return _demo_valuation(payload.address, as_of)

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

    qualifying = [c for c in comps if c.get("lastSalePrice") and c.get("lastSaleDate") and c.get("propertyType") == subject.get("propertyType")]
    if len(qualifying) < 3:
        return Valuation(
            run_id=f"insufficient-{uuid.uuid4()}",
            estimate_status=EstimateStatus.INSUFFICIENT_EVIDENCE,
            as_of_date=as_of,
            model_version="comps-gate-v0.1",
            data_snapshot_version=f"rentcast-{now.date().isoformat()}",
            address=subject.get("formattedAddress", payload.address),
            property_facts=subject,
            comparables=[],
            warnings=["Fewer than three attributable arm's-length-style closed transactions were found"],
            assumptions=["Live estimates remain disabled pending validated market-supported adjustments"],
            sources=[subject_evidence],
            explanation="Insufficient comparable evidence is available for a defensible estimate. Property facts are shown where the provider supplied them.",
            disclaimers=["No valuation is reported", "Experimental estimate, not an appraisal", "No 5% accuracy claim"],
        )

    raise HTTPException(status_code=501, detail={"code":"model_not_implemented","message":"Attributable live comparables were found, but the fitted valuation model has not passed validation gates"})


@app.get("/api/v1/valuations/{run_id}")
async def get_valuation(run_id: str):
    raise HTTPException(status_code=404, detail={"code": "run_not_persisted", "message": "Runs are not persisted in this prototype; use the POST response as a synchronous snapshot"})
