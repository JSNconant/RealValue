/**
 * Persistent Client Data Store
 * Manages searches, saved homes, downloads, charges and invoices per user.
 * Supports seeding investor demo data.
 */

export type SavedSearchRecord = {
  id: string;
  userId: string;
  address: string;
  estimateCents: number | null;
  lowCents: number | null;
  highCents: number | null;
  confidence: "High" | "Medium" | "Low" | null;
  status: string;
  createdAt: string; // ISO
  saved: boolean;
  facts: Record<string, unknown>;
  compsCount: number;
};

export type DownloadRecord = {
  id: string;
  userId: string;
  searchId: string;
  address: string;
  estimateCents: number | null;
  downloadedAt: string; // ISO
  fileSizeKb: number;
  fileName: string;
};

export type ChargeRecord = {
  id: string;
  userId: string;
  searchId: string;
  address: string;
  amountCents: number; // 400 = $4.00
  status: "succeeded" | "pending" | "refunded";
  createdAt: string; // ISO
};

const STORE_KEY_PREFIX = "rv:data:v1:";

export function getUserStore(userId: string) {
  if (typeof window === "undefined") {
    return {
      searches: [] as SavedSearchRecord[],
      downloads: [] as DownloadRecord[],
      charges: [] as ChargeRecord[],
    };
  }

  const raw = localStorage.getItem(`${STORE_KEY_PREFIX}${userId}`);
  if (!raw) {
    return {
      searches: [] as SavedSearchRecord[],
      downloads: [] as DownloadRecord[],
      charges: [] as ChargeRecord[],
    };
  }

  try {
    return JSON.parse(raw) as {
      searches: SavedSearchRecord[];
      downloads: DownloadRecord[];
      charges: ChargeRecord[];
    };
  } catch {
    return { searches: [], downloads: [], charges: [] };
  }
}

export function saveUserStore(
  userId: string,
  data: {
    searches: SavedSearchRecord[];
    downloads: DownloadRecord[];
    charges: ChargeRecord[];
  }
) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${STORE_KEY_PREFIX}${userId}`, JSON.stringify(data));
}

export const PRICE_PER_SEARCH_CENTS = 400; // $4.00 stored in cents
