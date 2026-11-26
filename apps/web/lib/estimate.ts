/**
 * getEstimate — unified adapter
 *
 * All valuation calls go through this one function.
 * Maps the backend ValuationResult to EstimateResult.
 *
 * Fields the algorithm doesn't yet return come back as null.
 * UI modules check for null and hide themselves — no invented data.
 */

import {
  getLiveValuation,
  getDemoValuation,
  type ValuationResult,
} from "./api";

// ---- Input -------------------------------------------------

export type PropertyInput = {
  address: string;
  demo?: boolean;
  // Confirm-step overrides (sent to backend when available)
  propertyType?: string;
  beds?: number;
  baths?: number;
  sqft?: number;
  lotSqft?: number;
  yearBuilt?: number;
  condition?: "excellent" | "good" | "fair" | "poor";
};

// ---- Output ------------------------------------------------

export type Comparable = {
  address: string;
  distanceMiles: number | null;
  transactionDate: string | null;   // ISO date
  salePriceCents: number | null;
  livingAreaSqft: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  weight: number;                   // 0–1 fractional weight used in median
};

export type Factor = {
  label: string;
  effect: "positive" | "negative" | "neutral";
  description: string;
};

export type HistoryPoint = {
  date: string;    // ISO date
  valueCents: number;
};

export type Confidence = "High" | "Medium" | "Low";

export type EstimateStatus =
  | "validated_market_value"
  | "experimental_market_indicator"
  | "insufficient_evidence"
  | "unsupported_property"
  | "provider_unavailable"
  | "error";

export type EstimateResult = {
  runId: string;
  address: string;
  estimate: number | null;      // cents; null = no estimate, hide value
  low: number | null;           // cents; null = hide range bar
  high: number | null;          // cents; null = hide range bar
  confidence: Confidence | null;// null = hide confidence module
  dataAsOf: string;             // ISO date
  modelVersion: string;
  comparables: Comparable[];
  factors: Factor[] | null;     // null = hide factors module (not yet in algo)
  history: HistoryPoint[] | null; // null = hide history chart
  status: EstimateStatus;
  warnings: string[];
  disclaimers: string[];
  explanation: string;
  propertyFacts: Record<string, unknown>;
  isSampleData: boolean;
};

// ---- Mapping -----------------------------------------------

function mapConfidence(status: string): Confidence | null {
  switch (status) {
    case "validated_market_value":
      return "High";
    case "experimental_market_indicator":
      return "Medium";
    case "insufficient_evidence":
      return "Low";
    default:
      return null;
  }
}

function mapComparables(raw: ValuationResult["comparables"]): Comparable[] {
  return raw.map((c) => ({
    address: c.address,
    distanceMiles: c.distance_miles,
    transactionDate: c.transaction_date,
    salePriceCents: c.sale_price_cents,
    livingAreaSqft: c.living_area_sqft,
    bedrooms: c.bedrooms,
    bathrooms: c.bathrooms,
    weight: c.weight,
  }));
}

function detectSampleData(result: ValuationResult): boolean {
  return result.disclaimers.some(
    (d) =>
      d.includes("DEMO") ||
      d.includes("Fictional") ||
      d.includes("fixture") ||
      d.includes("Sample"),
  );
}

// ---- Public API --------------------------------------------

export async function getEstimate(
  property: PropertyInput,
): Promise<EstimateResult> {
  const raw = property.demo
    ? await getDemoValuation(property.address)
    : await getLiveValuation(property.address);

  return {
    runId: raw.run_id,
    address: raw.address,
    estimate: raw.estimate_cents,
    low: raw.interval_low_cents,          // null if not returned → range bar hidden
    high: raw.interval_high_cents,        // null if not returned → range bar hidden
    confidence: mapConfidence(raw.estimate_status),
    dataAsOf: raw.as_of_date,
    modelVersion: raw.model_version,
    comparables: mapComparables(raw.comparables),
    factors: null,   // algorithm does not yet return factors — module hidden
    history: null,   // algorithm does not yet return history — module hidden
    status: raw.estimate_status as EstimateStatus,
    warnings: raw.warnings,
    disclaimers: raw.disclaimers,
    explanation: raw.explanation,
    propertyFacts: raw.property_facts,
    isSampleData: detectSampleData(raw),
  };
}

// ---- Formatting helpers ------------------------------------

export function formatUsd(cents: number | null): string {
  if (cents == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function formatUsdCompact(cents: number | null): string {
  if (cents == null) return "—";
  const value = cents / 100;
  if (value >= 1_000_000)
    return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000)
    return `$${Math.round(value / 1_000)}K`;
  return formatUsd(cents);
}
