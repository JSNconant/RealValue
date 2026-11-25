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

const CACHE_PREFIX = "realvalue:valuation:v1:";
const CACHE_TTL_MS = 1000 * 60 * 60 * 6;
const inFlightRequests = new Map<string, Promise<ValuationResult>>();

function cacheKey(address: string, demo: boolean): string {
  const normalized = address.trim().toLowerCase().replace(/\s+/g, " ");
  return `${CACHE_PREFIX}${demo ? "demo" : "live"}:${normalized}`;
}

function readCached(key: string): ValuationResult | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { expiresAt: number; data: ValuationResult };
    if (!parsed.expiresAt || Date.now() > parsed.expiresAt) {
      window.localStorage.removeItem(key);
      return null;
    }
    return parsed.data;
  } catch {
    window.localStorage.removeItem(key);
    return null;
  }
}

function writeCached(key: string, data: ValuationResult): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify({ expiresAt: Date.now() + CACHE_TTL_MS, data }));
}

async function requestValuation(address: string, demo: boolean): Promise<ValuationResult> {
  const key = cacheKey(address, demo);
  const cached = readCached(key);
  if (cached) return cached;

  const existing = inFlightRequests.get(key);
  if (existing) return existing;

  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
  const promise = fetch(`${base}/api/v1/valuations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address, demo }),
    cache: "no-store",
  })
    .then(async (response) => {
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.detail?.message || `Request failed (${response.status})`);
      }
      return response.json() as Promise<ValuationResult>;
    })
    .then((result) => {
      writeCached(key, result);
      return result;
    })
    .finally(() => {
      inFlightRequests.delete(key);
    });

  inFlightRequests.set(key, promise);
  return promise;
}

export async function getDemoValuation(address: string): Promise<ValuationResult> {
  return requestValuation(address, true);
}

export async function getLiveValuation(address: string): Promise<ValuationResult> {
  return requestValuation(address, false);
}

export function formatUsd(cents: number | null): string {
  if (cents == null) return "Not available";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);
}
