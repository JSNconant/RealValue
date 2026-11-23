from datetime import date, datetime
from enum import Enum
from typing import Literal
from pydantic import BaseModel, Field


class EstimateStatus(str, Enum):
    VALIDATED_MARKET_VALUE = "validated_market_value"
    EXPERIMENTAL_MARKET_INDICATOR = "experimental_market_indicator"
    INSUFFICIENT_EVIDENCE = "insufficient_evidence"
    UNSUPPORTED_PROPERTY = "unsupported_property"
    PROVIDER_UNAVAILABLE = "provider_unavailable"


class Evidence(BaseModel):
    evidence_id: str
    provider: str
    record_id: str | None = None
    field: str
    value: str
    retrieved_at: datetime
    observed_at: datetime | None = None
    source_url: str | None = None
    source_url_label: Literal["property_record", "provider_documentation"] | None = None
    confidence_status: str


class Comparable(BaseModel):
    address: str
    distance_miles: float | None = None
    transaction_date: date | None = None
    sale_price_cents: int | None = None
    living_area_sqft: float | None = None
    bedrooms: float | None = None
    bathrooms: float | None = None
    lot_area_sqft: float | None = None
    year_built: int | None = None
    adjusted_price_cents: int
    weight: float
    used: bool = True
    exclusion_reasons: list[str] = Field(default_factory=list)
    evidence_ids: list[str] = Field(default_factory=list)


class Valuation(BaseModel):
    run_id: str
    estimate_status: EstimateStatus
    estimate_cents: int | None = None
    interval_low_cents: int | None = None
    interval_high_cents: int | None = None
    interval_definition: str | None = None
    as_of_date: date
    model_version: str
    data_snapshot_version: str
    address: str
    property_facts: dict[str, object]
    comparables: list[Comparable]
    excluded_comparables: list[dict[str, object]] = Field(default_factory=list)
    warnings: list[str]
    assumptions: list[str]
    sources: list[Evidence]
    explanation: str
    disclaimers: list[str]


class ValuationRequest(BaseModel):
    address: str = Field(min_length=5, max_length=300)
    as_of_date: date | None = None
    demo: bool = False


class AddressSearchRequest(BaseModel):
    q: str = Field(min_length=3, max_length=300)
