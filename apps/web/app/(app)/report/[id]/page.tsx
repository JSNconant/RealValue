"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getUserStore, saveUserStore, type SavedSearchRecord, type DownloadRecord } from "@/lib/store";
import { formatUsd, type EstimateResult } from "@/lib/estimate";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import {
  Download,
  Bookmark,
  BookmarkCheck,
  Edit3,
  Search,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  MapPin,
  Calendar,
  Layers,
  ArrowLeft,
} from "lucide-react";

export default function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();

  const [record, setRecord] = useState<SavedSearchRecord | null>(null);
  const [cachedResult, setCachedResult] = useState<EstimateResult | null>(null);
  const [saved, setSaved] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!id) return;
    const userId = user?.id || "demo-user";
    const store = getUserStore(userId);
    const found = store.searches.find((s) => s.id === id);
    if (found) {
      setRecord(found);
      setSaved(found.saved);
    }

    // Try reading detailed valuation from session cache
    const rawCache = sessionStorage.getItem(`rv:report:${id}`);
    if (rawCache) {
      try {
        setCachedResult(JSON.parse(rawCache));
      } catch {}
    }
  }, [id, user]);

  function handleToggleSave() {
    if (!record) return;
    const userId = user?.id || "demo-user";
    const store = getUserStore(userId);
    const item = store.searches.find((s) => s.id === record.id);
    if (item) {
      item.saved = !item.saved;
      saveUserStore(userId, store);
      setSaved(item.saved);
      if (item.saved) {
        toast.success("Home saved to your list.");
      } else {
        toast.info("Home removed from saved list.");
      }
    }
  }

  async function handleDownloadPdf() {
    if (!record || downloading) return;
    setDownloading(true);

    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "letter" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 40;
      const contentWidth = pageWidth - margin * 2;
      let y = 50;

      const printText = (text: string, size = 11, bold = false, color = [11, 31, 58], gap = 16) => {
        doc.setFont("helvetica", bold ? "bold" : "normal");
        doc.setFontSize(size);
        doc.setTextColor(color[0], color[1], color[2]);
        const lines = doc.splitTextToSize(text, contentWidth);
        doc.text(lines, margin, y);
        y += lines.length * (size + 3) + gap;
        if (y > 720) {
          doc.addPage();
          y = 50;
        }
      };

      // Header
      printText("RealValue Property Report", 20, true, [11, 31, 58], 6);
      printText(`Report ID: ${record.id} • Date: ${new Date().toLocaleDateString("en-US")}`, 10, false, [74, 86, 104], 20);

      // Address & Facts
      printText(`Address: ${record.address}`, 14, true, [11, 31, 58], 8);
      printText(`Estimate Status: ${record.status.replaceAll("_", " ").toUpperCase()}`, 10, true, [10, 91, 211], 16);

      // Big Estimate
      printText(`Estimated Value: ${formatUsd(record.estimateCents)}`, 24, true, [11, 31, 58], 8);
      if (record.lowCents && record.highCents) {
        printText(`Likely Range: ${formatUsd(record.lowCents)} – ${formatUsd(record.highCents)}`, 12, false, [74, 86, 104], 16);
      }

      // Mandatory Disclaimer
      printText(
        "Notice: This is a computer-generated estimate, not an appraisal, and cannot be used in place of one. " +
        "RealValue does not guarantee price accuracy.",
        10,
        false,
        [138, 83, 0],
        20
      );

      // Comparables list
      if (cachedResult?.comparables && cachedResult.comparables.length > 0) {
        printText("Comparable Sales Evidence", 14, true, [11, 31, 58], 10);
        for (const comp of cachedResult.comparables) {
          const compLine = `• ${comp.address} | Sold: ${formatUsd(comp.salePriceCents)} | ${comp.distanceMiles ? comp.distanceMiles.toFixed(1) + " mi" : "Nearby"} | Weight: ${(comp.weight * 100).toFixed(1)}%`;
          printText(compLine, 10, false, [74, 86, 104], 4);
        }
      }

      const fileName = `realvalue-report-${record.address.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pdf`;
      doc.save(fileName);

      // STRICT DOWNLOAD RULE:
      // A search appears in Downloads ONLY after the user clicks Download and the file is generated!
      const userId = user?.id || "demo-user";
      const store = getUserStore(userId);
      const existingDl = store.downloads.find((d) => d.searchId === record.id);

      if (existingDl) {
        // Updating timestamp on repeat download without duplicate row
        existingDl.downloadedAt = new Date().toISOString();
      } else {
        store.downloads.unshift({
          id: `dl_${Math.random().toString(36).slice(2, 10)}`,
          userId,
          searchId: record.id,
          address: record.address,
          estimateCents: record.estimateCents,
          downloadedAt: new Date().toISOString(),
          fileSizeKb: 48,
          fileName,
        });
      }
      saveUserStore(userId, store);
      toast.success("PDF report downloaded and added to your Downloads.");
    } catch {
      toast.error("Unable to generate PDF report.");
    } finally {
      setDownloading(false);
    }
  }

  if (!record) {
    return (
      <Card variant="bordered" style={{ padding: 48, textAlign: "center" }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>Report not found</h2>
        <p style={{ color: "var(--color-secondary)", marginBottom: 20 }}>
          This report could not be located in your history.
        </p>
        <Link href="/searches" className="btn btn--secondary">
          View all searches
        </Link>
      </Card>
    );
  }

  return (
    <div>
      {/* Top back button & Action Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <Link href="/searches" className="btn btn--ghost btn--sm">
          <ArrowLeft size={16} /> Back to searches
        </Link>

        <div style={{ display: "flex", gap: 10 }}>
          <Button variant="secondary" size="sm" onClick={handleToggleSave}>
            {saved ? (
              <>
                <BookmarkCheck size={16} color="var(--color-trust)" /> Saved
              </>
            ) : (
              <>
                <Bookmark size={16} /> Save home
              </>
            )}
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.push(`/search?q=${encodeURIComponent(record.address)}`)}
          >
            <Edit3 size={16} /> Edit facts
          </Button>

          <Button variant="primary" size="sm" loading={downloading} onClick={handleDownloadPdf}>
            <Download size={16} /> Download PDF
          </Button>
        </div>
      </div>

      {/* 1. Address & Facts Header */}
      <Card variant="bordered" style={{ padding: "32px 32px", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              {cachedResult?.isSampleData ? (
                <Badge variant="sample">Sample fixture</Badge>
              ) : (
                <Badge variant="blue">Attributable provider record</Badge>
              )}
              <span style={{ fontSize: 13, color: "var(--color-secondary)" }}>
                Model: {cachedResult?.modelVersion || "sales-comps-v0.1"} • As of {new Date(record.createdAt).toLocaleDateString("en-US")}
              </span>
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 700, margin: "0 0 6px" }}>{record.address}</h1>
          </div>
          <div style={{ textAlign: "right" }}>
            <span className="badge badge--warning">Experimental indicator</span>
          </div>
        </div>

        {/* 2. Large Estimate */}
        <div style={{ margin: "24px 0 16px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-secondary)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>
            Estimated Value
          </div>
          <div className="tabular" style={{ fontSize: 56, fontWeight: 700, color: "var(--color-ink)", lineHeight: 1.1 }}>
            {formatUsd(record.estimateCents)}
          </div>
        </div>

        {/* 3. Horizontal low-to-high range bar (if available) */}
        {record.lowCents && record.highCents && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ height: 8, background: "var(--color-divider)", borderRadius: 99, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", left: "20%", width: "60%", height: "100%", background: "var(--color-trust)", borderRadius: 99 }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 13, color: "var(--color-secondary)" }}>
              <span>Low: {formatUsd(record.lowCents)}</span>
              <span style={{ color: "var(--color-trust)", fontWeight: 700 }}>Estimate marked</span>
              <span>High: {formatUsd(record.highCents)}</span>
            </div>
          </div>
        )}

        {/* 4. Confidence High/Medium/Low with plain explanation */}
        <div
          style={{
            padding: "14px 18px",
            background: "var(--color-page)",
            borderRadius: "var(--radius-input)",
            border: "1px solid var(--color-divider)",
            marginBottom: 24,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <strong>Confidence:</strong>
            <span className="badge badge--blue">{record.confidence || "Medium"}</span>
          </div>
          <p style={{ margin: 0, fontSize: 14, color: "var(--color-secondary)", lineHeight: 1.5 }}>
            This confidence reflects our testing status. Because the underlying model has not completed
            formal held-out backtesting across diverse geographies, we report uncalibrated experimental indicators.
          </p>
        </div>

        {/* 5. Property facts grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 16, paddingTop: 16, borderTop: "1px solid var(--color-divider)" }}>
          {Object.entries(record.facts).map(([k, v]) => (
            <div key={k}>
              <div style={{ fontSize: 12, color: "var(--color-secondary)", textTransform: "capitalize" }}>
                {k.replace(/([A-Z])/g, " $1")}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--color-ink)", marginTop: 2 }}>
                {String(v)}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 6. Why this price (Factors module — hidden if algorithm does not return factors) */}
      {cachedResult?.factors && cachedResult.factors.length > 0 && (
        <Card variant="bordered" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, marginBottom: 12 }}>Why this price?</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {cachedResult.factors.map((f, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: 8 }}>
                <span>{f.label}</span>
                <span>{f.description}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 7. Comparable Homes Table */}
      {cachedResult?.comparables && cachedResult.comparables.length > 0 && (
        <Card variant="bordered" style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Comparable closed sales</h2>
            <span style={{ fontSize: 13, color: "var(--color-secondary)" }}>
              {cachedResult.comparables.length} sales found
            </span>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Address</th>
                  <th>Sale Price</th>
                  <th>Sale Date</th>
                  <th>Distance</th>
                  <th>Living Area</th>
                  <th>Weight</th>
                </tr>
              </thead>
              <tbody>
                {cachedResult.comparables.map((c) => (
                  <tr key={c.address}>
                    <td style={{ fontWeight: 600 }}>{c.address}</td>
                    <td className="tabular" style={{ fontWeight: 700 }}>
                      {formatUsd(c.salePriceCents)}
                    </td>
                    <td style={{ color: "var(--color-secondary)" }}>{c.transactionDate || "N/A"}</td>
                    <td style={{ color: "var(--color-secondary)" }}>
                      {c.distanceMiles ? `${c.distanceMiles.toFixed(1)} mi` : "Nearby"}
                    </td>
                    <td style={{ color: "var(--color-secondary)" }}>
                      {c.livingAreaSqft ? `${c.livingAreaSqft.toLocaleString()} sq ft` : "—"}
                    </td>
                    <td style={{ color: "var(--color-trust)", fontWeight: 700 }}>
                      {(c.weight * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* 8. Mandatory Disclaimer */}
      <div
        className="disclaimer"
        style={{
          padding: "16px 20px",
          background: "var(--color-page)",
          border: "1.5px solid var(--color-divider)",
          borderRadius: "var(--radius-input)",
        }}
      >
        <p style={{ margin: 0, fontSize: 13, color: "var(--color-secondary)", lineHeight: 1.5 }}>
          <strong>Notice:</strong> This is a computer-generated estimate, not an appraisal, and cannot be used
          in place of one. Estimates are unvalidated and should not be used as the sole basis for lending,
          tax, or legal transactions.
        </p>
      </div>
    </div>
  );
}
