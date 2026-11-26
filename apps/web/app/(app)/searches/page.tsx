"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getUserStore, type SavedSearchRecord } from "@/lib/store";
import { formatUsd } from "@/lib/estimate";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Search, History, ArrowRight } from "lucide-react";

export default function SearchesPage() {
  const { user } = useAuth();
  const [searches, setSearches] = useState<SavedSearchRecord[]>([]);
  const [filterText, setFilterText] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "price">("date");

  useEffect(() => {
    if (!user) return;
    const store = getUserStore(user.id);
    setSearches(store.searches);
  }, [user]);

  const filtered = searches
    .filter((s) => s.address.toLowerCase().includes(filterText.toLowerCase().trim()))
    .sort((a, b) => {
      if (sortBy === "price") {
        return (b.estimateCents || 0) - (a.estimateCents || 0);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: "0 0 6px" }}>Search History</h1>
          <p style={{ color: "var(--color-secondary)", fontSize: 15, margin: 0 }}>
            Reopening past searches is always free and shows the original values and timestamp.
          </p>
        </div>
        <Link href="/search">
          <Button size="md">
            <Search size={16} /> New search
          </Button>
        </Link>
      </div>

      {/* Filter and Sort Controls */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <Input
            placeholder="Filter by address…"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
        </div>
        <select
          className="field__input"
          style={{ width: "auto" }}
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
        >
          <option value="date">Sort by most recent</option>
          <option value="price">Sort by highest estimate</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <Card variant="bordered" style={{ padding: 48, textAlign: "center" }}>
          <History size={36} color="var(--color-secondary)" style={{ opacity: 0.5, margin: "0 auto 12px" }} />
          <h2 style={{ fontSize: 18, marginBottom: 6 }}>No searches found</h2>
          <p style={{ color: "var(--color-secondary)", fontSize: 14 }}>
            {filterText ? "No searches match your filter." : "You have not run any property searches yet."}
          </p>
        </Card>
      ) : (
        <Card variant="bordered">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Address</th>
                  <th>Estimate</th>
                  <th>Date Searched</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600 }}>{s.address}</td>
                    <td className="tabular" style={{ fontWeight: 700 }}>
                      {formatUsd(s.estimateCents)}
                    </td>
                    <td style={{ color: "var(--color-secondary)", fontSize: 13 }}>
                      {new Date(s.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td>
                      <span className="badge badge--sample">Snapshot</span>
                    </td>
                    <td>
                      <Link href={`/report/${s.id}`} className="btn btn--ghost btn--sm">
                        View report &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
