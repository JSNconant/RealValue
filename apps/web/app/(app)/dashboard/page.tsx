"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getUserStore, saveUserStore, PRICE_PER_SEARCH_CENTS, type SavedSearchRecord, type DownloadRecord } from "@/lib/store";
import { formatUsd } from "@/lib/estimate";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  Search,
  History,
  Bookmark,
  Download,
  CreditCard,
  ArrowRight,
  TrendingUp,
  FileText,
  MapPin,
  ExternalLink,
  Sparkles,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [addressInput, setAddressInput] = useState("");
  const [searches, setSearches] = useState<SavedSearchRecord[]>([]);
  const [downloads, setDownloads] = useState<DownloadRecord[]>([]);

  useEffect(() => {
    if (!user) return;
    const data = getUserStore(user.id);
    setSearches(data.searches);
    setDownloads(data.downloads);
  }, [user]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (addressInput.trim().length >= 5) {
      router.push(`/search?q=${encodeURIComponent(addressInput.trim())}`);
    }
  }

  // Calculate live database numbers (never fake)
  const savedHomesCount = searches.filter((s) => s.saved).length;
  const billedSearchesCount = searches.length;
  const currentTotalCents = billedSearchesCount * PRICE_PER_SEARCH_CENTS;
  const recentSearches = searches.slice(0, 5);
  const recentDownloads = downloads.slice(0, 3);
  const savedHomes = searches.filter((s) => s.saved).slice(0, 3);

  return (
    <div>
      {/* Greeting & Address Lookup */}
      <div style={{ marginBottom: 36 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>
          Welcome, {user?.fullName ? user.fullName.split(" ")[0] : "Homeowner"}
        </h1>
        <p style={{ color: "var(--color-secondary)", fontSize: 16, marginBottom: 24 }}>
          Search an address to view its estimate, price range, and the comparable sales behind it.
        </p>

        {/* Big Search Input */}
        <form onSubmit={handleSearchSubmit} style={{ maxWidth: 720 }}>
          <div style={{ display: "flex", gap: 12, position: "relative", flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: 1, minWidth: 260 }}>
              <MapPin
                size={20}
                style={{
                  position: "absolute",
                  left: 16,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--color-secondary)",
                }}
              />
              <input
                type="text"
                placeholder="Enter address (e.g. 123 Fictional Ave, Austin, TX 78704)"
                value={addressInput}
                onChange={(e) => setAddressInput(e.target.value)}
                style={{
                  width: "100%",
                  height: 54,
                  paddingLeft: 48,
                  paddingRight: 16,
                  borderRadius: "var(--radius-input)",
                  border: "1.5px solid var(--color-input-border)",
                  fontSize: 16,
                  background: "var(--color-surface)",
                }}
              />
            </div>
            <Button type="submit" size="lg" disabled={addressInput.trim().length < 5}>
              <Search size={18} aria-hidden />
              Search property
            </Button>
          </div>
          <div style={{ marginTop: 8, fontSize: 13, color: "var(--color-secondary)" }}>
            This is a computer-generated estimate, not an appraisal, and cannot be used in place of one.
          </div>
        </form>
      </div>

      {/* 4 Summary Tiles (database driven) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 20,
          marginBottom: 36,
        }}
      >
        <Card variant="bordered" style={{ padding: "20px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "var(--color-secondary)", marginBottom: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>Total bill this period</span>
            <CreditCard size={18} color="var(--color-trust)" />
          </div>
          <div className="tabular" style={{ fontSize: 28, fontWeight: 700, color: "var(--color-ink)" }}>
            {formatUsd(currentTotalCents)}
          </div>
          <div style={{ fontSize: 12, color: "var(--color-secondary)", marginTop: 4 }}>
            {billedSearchesCount} search{billedSearchesCount === 1 ? "" : "es"} &times; $4.00
          </div>
        </Card>

        <Card variant="bordered" style={{ padding: "20px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "var(--color-secondary)", marginBottom: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>Searches this period</span>
            <History size={18} color="var(--color-trust)" />
          </div>
          <div className="tabular" style={{ fontSize: 28, fontWeight: 700, color: "var(--color-ink)" }}>
            {billedSearchesCount}
          </div>
          <div style={{ fontSize: 12, color: "var(--color-secondary)", marginTop: 4 }}>
            Past reports are free to reopen
          </div>
        </Card>

        <Card variant="bordered" style={{ padding: "20px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "var(--color-secondary)", marginBottom: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>Reports downloaded</span>
            <Download size={18} color="var(--color-trust)" />
          </div>
          <div className="tabular" style={{ fontSize: 28, fontWeight: 700, color: "var(--color-ink)" }}>
            {downloads.length}
          </div>
          <div style={{ fontSize: 12, color: "var(--color-secondary)", marginTop: 4 }}>
            Strictly recorded on PDF export
          </div>
        </Card>

        <Card variant="bordered" style={{ padding: "20px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "var(--color-secondary)", marginBottom: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>Saved homes</span>
            <Bookmark size={18} color="var(--color-trust)" />
          </div>
          <div className="tabular" style={{ fontSize: 28, fontWeight: 700, color: "var(--color-ink)" }}>
            {savedHomesCount}
          </div>
          <div style={{ fontSize: 12, color: "var(--color-secondary)", marginTop: 4 }}>
            Properties tracked for updates
          </div>
        </Card>
      </div>

      {/* Main Grid: Recent Searches + Billing Summary */}
      {searches.length === 0 ? (
        /* Friendly empty state for brand-new users */
        <Card variant="bordered" style={{ padding: "64px 32px", textAlign: "center" }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "var(--color-blue-tint)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <Search size={24} color="var(--color-trust)" />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>No searches yet</h2>
          <p style={{ color: "var(--color-secondary)", fontSize: 15, maxWidth: 420, margin: "0 auto 24px" }}>
            Enter an address above or click the button below to run your first residential valuation.
          </p>
          <Link href="/search">
            <Button size="lg">Run your first search</Button>
          </Link>
        </Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24, alignItems: "start" }}>
          {/* Left Column: Recent Searches Table */}
          <Card variant="bordered">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Recent searches</h2>
              <Link href="/searches" style={{ fontSize: 14, color: "var(--color-trust)", textDecoration: "none", fontWeight: 600 }}>
                View all &rarr;
              </Link>
            </div>

            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Address</th>
                    <th>Estimate</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSearches.map((s) => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 600, color: "var(--color-ink)" }}>{s.address}</td>
                      <td className="tabular" style={{ fontWeight: 700 }}>
                        {formatUsd(s.estimateCents)}
                      </td>
                      <td style={{ color: "var(--color-secondary)", fontSize: 13 }}>
                        {new Date(s.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 8 }}>
                          <Link href={`/report/${s.id}`} className="btn btn--ghost btn--sm">
                            View
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Right Column: Billing snapshot & Recent Downloads */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Billing Card */}
            <Card variant="bordered">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Billing summary</h3>
                <span className="badge badge--sample">Demo</span>
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 13, color: "var(--color-secondary)" }}>Current calendar period</div>
                <div className="tabular" style={{ fontSize: 24, fontWeight: 700 }}>
                  {formatUsd(currentTotalCents)}
                </div>
              </div>
              <p style={{ fontSize: 13, color: "var(--color-secondary)", margin: "0 0 16px" }}>
                {billedSearchesCount} searches recorded this month at $4.00 each.
              </p>
              <Link href="/billing">
                <Button variant="secondary" size="sm" fullWidth>
                  View billing details
                </Button>
              </Link>
            </Card>

            {/* Saved Homes preview */}
            {savedHomes.length > 0 && (
              <Card variant="bordered">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Saved homes</h3>
                  <Link href="/saved" style={{ fontSize: 13, color: "var(--color-trust)" }}>
                    View all
                  </Link>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {savedHomes.map((sh) => (
                    <div
                      key={sh.id}
                      style={{
                        padding: "10px 12px",
                        background: "var(--color-page)",
                        borderRadius: "var(--radius-input)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div style={{ minWidth: 0, paddingRight: 8 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }} className="truncate">
                          {sh.address}
                        </div>
                        <div className="tabular" style={{ fontSize: 13, color: "var(--color-trust)", fontWeight: 700 }}>
                          {formatUsd(sh.estimateCents)}
                        </div>
                      </div>
                      <Link href={`/report/${sh.id}`} className="btn btn--ghost btn--sm">
                        View
                      </Link>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
