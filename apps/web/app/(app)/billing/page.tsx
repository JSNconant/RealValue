"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getUserStore, PRICE_PER_SEARCH_CENTS, type ChargeRecord } from "@/lib/store";
import { formatUsd } from "@/lib/estimate";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import {
  CreditCard,
  Download,
  AlertTriangle,
  Receipt,
  Calendar,
  CheckCircle2,
  FileText,
} from "lucide-react";

export default function BillingPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [charges, setCharges] = useState<ChargeRecord[]>([]);

  useEffect(() => {
    if (!user) return;
    const store = getUserStore(user.id);
    setCharges(store.charges);
  }, [user]);

  // Current calendar month total
  const totalCents = charges.reduce((acc, c) => acc + (c.status === "succeeded" ? c.amountCents : 0), 0);
  const now = new Date();
  const currentPeriod = `${now.toLocaleString("en-US", { month: "long" })} 1 – ${now.toLocaleString("en-US", { month: "long" })} ${new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()}, ${now.getFullYear()}`;

  async function handleDownloadInvoice(invoiceMonth: string, amount: number) {
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "letter" });
      let y = 60;

      const print = (text: string, size = 11, bold = false, color = [11, 31, 58]) => {
        doc.setFont("helvetica", bold ? "bold" : "normal");
        doc.setFontSize(size);
        doc.setTextColor(color[0], color[1], color[2]);
        doc.text(text, 50, y);
        y += size + 8;
      };

      print("RealValue — Billing Statement", 20, true, [11, 31, 58]);
      print(`Customer: ${user?.fullName || "Account"} (${user?.email})`, 10, false, [74, 86, 104]);
      print(`Billing Period: ${invoiceMonth}`, 10, false, [74, 86, 104]);
      print(`Status: Demo mode (no real payment collected)`, 10, true, [138, 83, 0]);
      y += 14;

      print(`Total Charges: ${formatUsd(amount)}`, 16, true, [11, 31, 58]);
      print(`Searches Conducted: ${charges.length}`, 11, false, [74, 86, 104]);
      y += 20;

      print("Itemized Searches:", 12, true, [11, 31, 58]);
      for (const chg of charges.slice(0, 15)) {
        print(`• ${chg.address} — ${formatUsd(chg.amountCents)} (${new Date(chg.createdAt).toLocaleDateString("en-US")})`, 10, false, [74, 86, 104]);
      }

      doc.save(`realvalue-invoice-${invoiceMonth.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`);
      toast.success("Billing invoice statement downloaded.");
    } catch {
      toast.error("Unable to generate invoice statement.");
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: "0 0 6px" }}>Billing &amp; Usage</h1>
        <p style={{ color: "var(--color-secondary)", fontSize: 15, margin: 0 }}>
          Usage-based pricing at $4.00 per successful search. No monthly subscription.
        </p>
      </div>

      {/* Demo mode banner (required) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "14px 20px",
          background: "#FFF8EB",
          border: "1px solid #EDCF8A",
          borderRadius: "var(--radius-input)",
          marginBottom: 28,
          fontSize: 14,
          color: "#704000",
        }}
      >
        <AlertTriangle size={18} style={{ flexShrink: 0 }} />
        <span>
          <strong>Demo mode:</strong> Real charges are not collected during testing.
          Pricing reflects planned early-access rate ($4.00 USD per successful report).
        </span>
      </div>

      {/* Current period summary card */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24, marginBottom: 32 }}>
        <Card variant="bordered" style={{ padding: "28px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 13, color: "var(--color-secondary)", fontWeight: 600 }}>
                CURRENT BILLING PERIOD
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--color-ink)", marginTop: 2 }}>
                {currentPeriod}
              </div>
            </div>
            <Badge variant="blue">$4.00 / search</Badge>
          </div>

          <div style={{ margin: "20px 0" }}>
            <div style={{ fontSize: 13, color: "var(--color-secondary)", marginBottom: 4 }}>
              Total accrued this period
            </div>
            <div className="tabular" style={{ fontSize: 44, fontWeight: 700, color: "var(--color-ink)", lineHeight: 1 }}>
              {formatUsd(totalCents)}
            </div>
            <div style={{ fontSize: 13, color: "var(--color-secondary)", marginTop: 6 }}>
              Calculated across {charges.length} successful residential searches.
            </div>
          </div>

          <div style={{ paddingTop: 16, borderTop: "1px solid var(--color-divider)", display: "flex", gap: 12 }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleDownloadInvoice("Current Period", totalCents)}
            >
              <Download size={15} /> Download current statement
            </Button>
          </div>
        </Card>

        {/* Payment method card */}
        <Card variant="bordered" style={{ padding: "28px 24px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Payment Method</h2>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 16px",
                background: "var(--color-page)",
                borderRadius: "var(--radius-input)",
                border: "1px solid var(--color-divider)",
                marginBottom: 12,
              }}
            >
              <CreditCard size={22} color="var(--color-trust)" />
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>Test Card •••• 4242</div>
                <div style={{ fontSize: 12, color: "var(--color-secondary)" }}>Stripe Test Environment</div>
              </div>
            </div>
            <p style={{ fontSize: 12, color: "var(--color-secondary)", margin: 0 }}>
              Never enter real credit cards. Payments will be enabled via Stripe at product launch.
            </p>
          </div>
        </Card>
      </div>

      {/* Itemized charges table */}
      <Card variant="bordered" style={{ marginBottom: 32 }}>
        <div style={{ padding: "20px 24px 12px", borderBottom: "1px solid var(--color-divider)" }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Itemized charges</h2>
        </div>

        {charges.length === 0 ? (
          <div style={{ padding: "36px 24px", textAlign: "center", color: "var(--color-secondary)", fontSize: 14 }}>
            No charges accrued yet. Charges only occur upon successful valuation searches.
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Address</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {charges.map((c) => (
                  <tr key={c.id}>
                    <td style={{ color: "var(--color-secondary)", fontSize: 13 }}>
                      {new Date(c.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td style={{ fontWeight: 600 }}>{c.address}</td>
                    <td className="tabular" style={{ fontWeight: 700 }}>
                      {formatUsd(c.amountCents)}
                    </td>
                    <td>
                      <Badge variant="success">Completed</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Past Invoices */}
      <Card variant="bordered">
        <div style={{ padding: "20px 24px 12px", borderBottom: "1px solid var(--color-divider)" }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Past monthly invoices</h2>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Invoice period</th>
                <th>Amount</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Download</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 600 }}>October 2026</td>
                <td className="tabular" style={{ fontWeight: 700 }}>$16.00</td>
                <td>
                  <Badge variant="neutral">Paid (Demo)</Badge>
                </td>
                <td style={{ textAlign: "right" }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownloadInvoice("October 2026", 1600)}
                  >
                    <Download size={14} /> PDF statement
                  </Button>
                </td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>September 2026</td>
                <td className="tabular" style={{ fontWeight: 700 }}>$24.00</td>
                <td>
                  <Badge variant="neutral">Paid (Demo)</Badge>
                </td>
                <td style={{ textAlign: "right" }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownloadInvoice("September 2026", 2400)}
                  >
                    <Download size={14} /> PDF statement
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
