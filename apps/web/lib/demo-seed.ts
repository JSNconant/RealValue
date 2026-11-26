/**
 * Investor Demo Seed Data
 * Exactly 12 realistic fictional searches, 4 downloads, 3 saved homes,
 * and 12 charge records totaling $48.00 USD (12 * $4.00 = $48.00).
 * All labeled "Sample data".
 */

import { type SavedSearchRecord, type DownloadRecord, type ChargeRecord, PRICE_PER_SEARCH_CENTS } from "./store";

export const DEMO_USER_ID = "usr_investor_demo";

export function generateInvestorDemoData() {
  const now = Date.now();
  const day = 86400000;

  const demoHomes = [
    {
      id: "srch_austin_001",
      address: "123 Fictional Ave, Austin, TX 78704",
      estimateCents: 84750000,
      lowCents: 79500000,
      highCents: 91000000,
      confidence: "Medium" as const,
      saved: true,
      beds: 3,
      baths: 2,
      sqft: 2150,
      yearBuilt: 1998,
      downloaded: true,
      fileSizeKb: 48,
    },
    {
      id: "srch_austin_002",
      address: "456 Mockingbird Ln, Austin, TX 78745",
      estimateCents: 62000000,
      lowCents: 58500000,
      highCents: 66000000,
      confidence: "Medium" as const,
      saved: true,
      beds: 3,
      baths: 2,
      sqft: 1840,
      yearBuilt: 2004,
      downloaded: true,
      fileSizeKb: 52,
    },
    {
      id: "srch_austin_003",
      address: "789 Barton Springs Rd, Austin, TX 78704",
      estimateCents: 125000000,
      lowCents: 118000000,
      highCents: 134000000,
      confidence: "Medium" as const,
      saved: true,
      beds: 4,
      baths: 3.5,
      sqft: 3200,
      yearBuilt: 2016,
      downloaded: true,
      fileSizeKb: 54,
    },
    {
      id: "srch_austin_004",
      address: "101 Travis Heights Blvd, Austin, TX 78704",
      estimateCents: 98000000,
      lowCents: 92000000,
      highCents: 105000000,
      confidence: "Medium" as const,
      saved: false,
      beds: 3,
      baths: 2,
      sqft: 2400,
      yearBuilt: 1985,
      downloaded: true,
      fileSizeKb: 46,
    },
    {
      id: "srch_austin_005",
      address: "204 South Congress Ave, Austin, TX 78704",
      estimateCents: 74500000,
      lowCents: 71000000,
      highCents: 79000000,
      confidence: "Medium" as const,
      saved: false,
      beds: 2,
      baths: 2,
      sqft: 1550,
      yearBuilt: 2012,
      downloaded: false,
      fileSizeKb: 0,
    },
    {
      id: "srch_austin_006",
      address: "312 Oltorf St W, Austin, TX 78704",
      estimateCents: 58000000,
      lowCents: 54500000,
      highCents: 62000000,
      confidence: "Medium" as const,
      saved: false,
      beds: 2,
      baths: 1,
      sqft: 1280,
      yearBuilt: 1968,
      downloaded: false,
      fileSizeKb: 0,
    },
    {
      id: "srch_austin_007",
      address: "520 Riverside Dr, Austin, TX 78704",
      estimateCents: 69000000,
      lowCents: 65000000,
      highCents: 73500000,
      confidence: "Medium" as const,
      saved: false,
      beds: 2,
      baths: 2,
      sqft: 1620,
      yearBuilt: 2008,
      downloaded: false,
      fileSizeKb: 0,
    },
    {
      id: "srch_austin_008",
      address: "630 Lamar Blvd S, Austin, TX 78704",
      estimateCents: 89000000,
      lowCents: 83000000,
      highCents: 96000000,
      confidence: "Medium" as const,
      saved: false,
      beds: 3,
      baths: 2.5,
      sqft: 2280,
      yearBuilt: 2001,
      downloaded: false,
      fileSizeKb: 0,
    },
    {
      id: "srch_austin_009",
      address: "715 Mary St, Austin, TX 78704",
      estimateCents: 79500000,
      lowCents: 75000000,
      highCents: 85000000,
      confidence: "Medium" as const,
      saved: false,
      beds: 3,
      baths: 2,
      sqft: 1920,
      yearBuilt: 1994,
      downloaded: false,
      fileSizeKb: 0,
    },
    {
      id: "srch_austin_010",
      address: "840 Evergreen Ave, Austin, TX 78704",
      estimateCents: 91000000,
      lowCents: 86000000,
      highCents: 97500000,
      confidence: "Medium" as const,
      saved: false,
      beds: 4,
      baths: 3,
      sqft: 2650,
      yearBuilt: 2006,
      downloaded: false,
      fileSizeKb: 0,
    },
    {
      id: "srch_austin_011",
      address: "925 Monroe St, Austin, TX 78704",
      estimateCents: 83000000,
      lowCents: 78000000,
      highCents: 89000000,
      confidence: "Medium" as const,
      saved: false,
      beds: 3,
      baths: 2,
      sqft: 2050,
      yearBuilt: 1989,
      downloaded: false,
      fileSizeKb: 0,
    },
    {
      id: "srch_austin_012",
      address: "1050 Live Oak St, Austin, TX 78704",
      estimateCents: 77000000,
      lowCents: 72500000,
      highCents: 82500000,
      confidence: "Medium" as const,
      saved: false,
      beds: 3,
      baths: 2,
      sqft: 1890,
      yearBuilt: 1999,
      downloaded: false,
      fileSizeKb: 0,
    },
  ];

  const searches: SavedSearchRecord[] = [];
  const downloads: DownloadRecord[] = [];
  const charges: ChargeRecord[] = [];

  demoHomes.forEach((item, index) => {
    const timestamp = new Date(now - index * day * 1.5).toISOString();

    searches.push({
      id: item.id,
      userId: DEMO_USER_ID,
      address: item.address,
      estimateCents: item.estimateCents,
      lowCents: item.lowCents,
      highCents: item.highCents,
      confidence: item.confidence,
      status: "experimental_market_indicator",
      createdAt: timestamp,
      saved: item.saved,
      facts: {
        propertyType: "Single Family",
        beds: item.beds,
        baths: item.baths,
        sqft: item.sqft,
        yearBuilt: item.yearBuilt,
        condition: "good",
      },
      compsCount: 4,
    });

    charges.push({
      id: `chg_demo_${index + 1}`,
      userId: DEMO_USER_ID,
      searchId: item.id,
      address: item.address,
      amountCents: PRICE_PER_SEARCH_CENTS,
      status: "succeeded",
      createdAt: timestamp,
    });

    if (item.downloaded) {
      downloads.push({
        id: `dl_demo_${downloads.length + 1}`,
        userId: DEMO_USER_ID,
        searchId: item.id,
        address: item.address,
        estimateCents: item.estimateCents,
        downloadedAt: timestamp,
        fileSizeKb: item.fileSizeKb,
        fileName: `realvalue-report-${item.address.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`,
      });
    }
  });

  return { searches, downloads, charges };
}
