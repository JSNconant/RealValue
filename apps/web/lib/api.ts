export type ValuationResult = {
  run_id: string;
  estimate_status: "validated_market_value" | "experimental_market_indicator" | "insufficient_evidence" | "unsupported_property" | "provider_unavailable";
  estimate_cents: number | null;
  interval_low_cents: number | null;
  interval_high_cents: number | null;
  interval_definition: string | null;
  as_of_date: string;
  model_version: string;
  data_snapshot_version: string;
  address: string;
  property_facts: Record<string, unknown>;
  comparables: Array<{
    address: string;
    distance_miles: number | null;
    transaction_date: string | null;
    sale_price_cents: number | null;
    living_area_sqft: number | null;
    bedrooms: number | null;
    bathrooms: number | null;
    adjusted_price_cents: number;
    weight: number;
  }>;
  warnings: string[];
  assumptions: string[];
  sources: Array<{ evidence_id: string; provider: string; record_id: string | null; field: string; value: string; retrieved_at: string; source_url: string | null }>;
  explanation: string;
  disclaimers: string[];
};

export async function getDemoValuation(address: string): Promise<ValuationResult> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
  const response = await fetch(`${base}/api/v1/valuations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address, demo: true }),
    cache: "no-store",
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.detail?.message || `Request failed (${response.status})`);
  }
  return response.json();
}

export async function getLiveValuation(address: string): Promise<ValuationResult> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
  const response = await fetch(`${base}/api/v1/valuations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address, demo: false }),
    cache: "no-store",
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.detail?.message || `Request failed (${response.status})`);
  }
  return response.json();
}

export function formatUsd(cents: number | null): string {
  if (cents == null) return "Not available";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);
}
