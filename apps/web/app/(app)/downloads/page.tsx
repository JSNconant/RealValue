"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getUserStore, saveUserStore, type DownloadRecord } from "@/lib/store";
import { formatUsd } from "@/lib/estimate";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { Download, Trash2, FileText, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";

export default function DownloadsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [downloads, setDownloads] = useState<DownloadRecord[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [reDownloadingId, setReDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const store = getUserStore(user.id);
    setDownloads(store.downloads);
  }, [user]);

  async function handleDownloadAgain(dl: DownloadRecord) {
    setReDownloadingId(dl.id);
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

      printText("RealValue Property Report", 20, true, [11, 31, 58], 6);
      printText(`Report ID: ${dl.searchId} • Re-downloaded: ${new Date().toLocaleDateString("en-US")}`, 10, false, [74, 86, 104], 20);
      printText(`Address: ${dl.address}`, 14, true, [11, 31, 58], 10);
      printText(`Estimated Value: ${formatUsd(dl.estimateCents)}`, 24, true, [11, 31, 58], 16);
      printText(
        "Notice: This is a computer-generated estimate, not an appraisal, and cannot be used in place of one.",
        10,
        false,
        [138, 83, 0],
        20
      );

      doc.save(dl.fileName || `realvalue-report.pdf`);

      // Update timestamp on re-download (no duplicate row)
      const userId = user?.id || "demo-user";
      const store = getUserStore(userId);
      const target = store.downloads.find((d) => d.id === dl.id);
      if (target) {
        target.downloadedAt = new Date().toISOString();
        saveUserStore(userId, store);
        setDownloads([...store.downloads]);
      }
      toast.success("Report downloaded again (timestamp updated).");
    } catch {
      toast.error("Failed to re-download PDF.");
    } finally {
      setReDownloadingId(null);
    }
  }

  function handleConfirmRemove(id: string) {
    if (!user) return;
    const store = getUserStore(user.id);
    store.downloads = store.downloads.filter((d) => d.id !== id);
    saveUserStore(user.id, store);
    setDownloads(store.downloads);
    setConfirmDeleteId(null);
    toast.info("Download record removed.");
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: "0 0 6px" }}>Downloads</h1>
        <p style={{ color: "var(--color-secondary)", fontSize: 15, margin: 0 }}>
          Valuation reports exported as PDF. Downloading is always free.
        </p>
      </div>

      {downloads.length === 0 ? (
        <Card variant="bordered" style={{ padding: "64px 32px", textAlign: "center" }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "var(--color-blue-tint)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <FileText size={24} color="var(--color-trust)" />
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
            Reports you download will appear here.
          </h2>
          <p style={{ color: "var(--color-secondary)", fontSize: 14, maxWidth: 380, margin: "0 auto 20px" }}>
            Search an address and click &ldquo;Download PDF&rdquo; on any report to generate a high-fidelity document.
          </p>
          <Link href="/search" className="btn btn--primary">
            Run a search
          </Link>
        </Card>
      ) : (
        <Card variant="bordered">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Address</th>
                  <th>Estimate at download</th>
                  <th>Downloaded</th>
                  <th>File size</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {downloads.map((dl) => (
                  <tr key={dl.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: "var(--color-ink)" }}>{dl.address}</div>
                      <div style={{ fontSize: 12, color: "var(--color-secondary)" }}>{dl.fileName}</div>
                    </td>
                    <td className="tabular" style={{ fontWeight: 700 }}>
                      {formatUsd(dl.estimateCents)}
                    </td>
                    <td style={{ color: "var(--color-secondary)", fontSize: 13 }}>
                      {new Date(dl.downloadedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td style={{ color: "var(--color-secondary)", fontSize: 13 }}>
                      {dl.fileSizeKb} KB
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          loading={reDownloadingId === dl.id}
                          onClick={() => handleDownloadAgain(dl)}
                        >
                          <Download size={14} /> Download again
                        </Button>

                        {confirmDeleteId === dl.id ? (
                          <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 12, color: "var(--color-error)" }}>Remove?</span>
                            <button
                              type="button"
                              className="btn btn--destructive btn--sm"
                              onClick={() => handleConfirmRemove(dl.id)}
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              className="btn btn--ghost btn--sm"
                              onClick={() => setConfirmDeleteId(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(dl.id)}
                            title="Remove download record"
                            style={{
                              background: "none",
                              border: "none",
                              color: "var(--color-secondary)",
                              cursor: "pointer",
                              padding: 6,
                              borderRadius: "var(--radius-sm)",
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
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
