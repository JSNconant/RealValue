"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getUserStore, saveUserStore, type SavedSearchRecord } from "@/lib/store";
import { formatUsd } from "@/lib/estimate";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { Bookmark, Trash2, ExternalLink } from "lucide-react";

export default function SavedHomesPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [savedHomes, setSavedHomes] = useState<SavedSearchRecord[]>([]);

  useEffect(() => {
    if (!user) return;
    const store = getUserStore(user.id);
    setSavedHomes(store.searches.filter((s) => s.saved));
  }, [user]);

  function handleRemove(item: SavedSearchRecord) {
    if (!user) return;
    const store = getUserStore(user.id);
    const target = store.searches.find((s) => s.id === item.id);
    if (target) {
      target.saved = false;
      saveUserStore(user.id, store);
      setSavedHomes(store.searches.filter((s) => s.saved));
      toast.info(`Removed ${item.address} from saved homes.`);
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: "0 0 6px" }}>Saved Homes</h1>
        <p style={{ color: "var(--color-secondary)", fontSize: 15, margin: 0 }}>
          Properties you are monitoring with their latest estimated values.
        </p>
      </div>

      {savedHomes.length === 0 ? (
        <Card variant="bordered" style={{ padding: 48, textAlign: "center" }}>
          <Bookmark size={36} color="var(--color-secondary)" style={{ opacity: 0.5, margin: "0 auto 12px" }} />
          <h2 style={{ fontSize: 18, marginBottom: 6 }}>No saved homes yet</h2>
          <p style={{ color: "var(--color-secondary)", fontSize: 14, marginBottom: 20 }}>
            Click &ldquo;Save home&rdquo; on any valuation report to track it here.
          </p>
          <Link href="/search" className="btn btn--primary">
            Search an address
          </Link>
        </Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
          {savedHomes.map((item) => (
            <Card key={item.id} variant="bordered" style={{ padding: "24px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <span className="badge badge--sample">Saved</span>
                <button
                  type="button"
                  onClick={() => handleRemove(item)}
                  title="Remove from saved"
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--color-secondary)",
                    cursor: "pointer",
                    padding: 4,
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <h2 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 8px" }}>{item.address}</h2>
              <div className="tabular" style={{ fontSize: 26, fontWeight: 700, color: "var(--color-ink)", marginBottom: 16 }}>
                {formatUsd(item.estimateCents)}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTop: "1px solid var(--color-divider)" }}>
                <span style={{ fontSize: 12, color: "var(--color-secondary)" }}>
                  Saved {new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
                <Link href={`/report/${item.id}`} className="btn btn--ghost btn--sm">
                  View report &rarr;
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
