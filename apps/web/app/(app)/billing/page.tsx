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
  Receipt,
  Calendar,
  CheckCircle2,
  FileText,
  ShieldCheck,
  Building,
  Check,
  ExternalLink,
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
  const statementId = `STMT-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}-${(user?.id || "USRDEMO").slice(-6).toUpperCase()}`;

  async function handleDownloadInvoice(invoiceMonth: string, amount: number, invNum = "INV-2026-11-0482") {
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "letter" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 48;
      const contentWidth = pageWidth - margin * 2;
      let y = 50;

      const print = (text: string, size = 10, bold = false, color = [11, 31, 58], gap = 14) => {
        doc.setFont("helvetica", bold ? "bold" : "normal");
        doc.setFontSize(size);
        doc.setTextColor(color[0], color[1], color[2]);
        const lines = doc.splitTextToSize(text, contentWidth);
        doc.text(lines, margin, y);
        y += lines.length * (size + 3) + gap;
      };

      // Company Letterhead
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(11, 31, 58);
      doc.text("RealValue Technologies, Inc.", margin, y);
      y += 18;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(74, 86, 104);
      doc.text("Residential Valuation Platform • 100 Congress Ave, Suite 2000, Austin, TX 78701", margin, y);
      y += 24;

      // Divider line
      doc.setDrawColor(227, 232, 239);
      doc.setLineWidth(1);
      doc.line(margin, y, pageWidth - margin, y);
      y += 24;

      // Invoice Details Grid
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(11, 31, 58);
      doc.text(`INVOICE STATEMENT #${invNum}`, margin, y);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(15, 115, 82);
      doc.text("PAID IN FULL", pageWidth - margin - 80, y);
      y += 18;

      print(`Billed To: ${user?.fullName || "Account Holder"} (${user?.email || "billing@account.com"})`, 10, false, [74, 86, 104], 4);
      print(`Billing Period: ${invoiceMonth}`, 10, false, [74, 86, 104], 4);
      print(`Payment Method: Visa ending in 4242 (Stripe Settlement)`, 10, false, [74, 86, 104], 4);
      print(`Date Issued: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, 10, false, [74, 86, 104], 20);

      // Table Header
      doc.setFillColor(245, 247, 250);
      doc.rect(margin, y, contentWidth, 22, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(74, 86, 104);
      doc.text("DESCRIPTION", margin + 10, y + 15);
      doc.text("QTY", margin + 340, y + 15);
      doc.text("RATE", margin + 390, y + 15);
      doc.text("AMOUNT (USD)", margin + 440, y + 15);
      y += 30;

      // Line items
      const items = charges.slice(0, 10);
      if (items.length === 0) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(11, 31, 58);
        doc.text("Valuation Services — Standard Search Usage", margin + 10, y);
        doc.text("1", margin + 345, y);
        doc.text("$4.00", margin + 390, y);
        doc.text(formatUsd(amount), margin + 440, y);
        y += 20;
      } else {
        for (const item of items) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(11, 31, 58);
          const desc = `Valuation Report: ${item.address}`;
          doc.text(doc.splitTextToSize(desc, 310), margin + 10, y);
          doc.text("1", margin + 345, y);
          doc.text("$4.00", margin + 390, y);
          doc.text(formatUsd(item.amountCents), margin + 440, y);
          y += 18;
          if (y > 700) {
            doc.addPage();
            y = 50;
          }
        }
      }

      y += 15;
      doc.line(margin, y, pageWidth - margin, y);
      y += 20;

      // Totals
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(74, 86, 104);
      doc.text("Subtotal:", margin + 350, y);
      doc.text(formatUsd(amount), margin + 440, y);
      y += 16;

      doc.text("Taxes & Fees (0%):", margin + 350, y);
      doc.text("$0.00", margin + 440, y);
      y += 18;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(11, 31, 58);
      doc.text("Total Paid:", margin + 350, y);
      doc.text(formatUsd(amount), margin + 440, y);
      y += 32;

      // Footer note
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(122, 134, 153);
      doc.text("This invoice statement reflects computer-generated property valuation usage under your enterprise account agreement.", margin, y);
      y += 12;
      doc.text("RealValue Technologies, Inc. • Questions? Contact support@realvalue.com", margin, y);

      doc.save(`realvalue-invoice-${invNum.toLowerCase()}.pdf`);
      toast.success("Official invoice statement downloaded.");
    } catch {
      toast.error("Unable to generate invoice statement.");
    }
  }

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: "0 0 6px" }}>Billing &amp; Financial Statements</h1>
          <p style={{ color: "var(--color-secondary)", fontSize: 15, margin: 0 }}>
            Usage-based valuation billing at $4.00 USD per successful report. Automatic monthly settlement.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleDownloadInvoice(currentPeriod, totalCents, statementId)}
          >
            <Download size={14} /> Download Current Statement
          </Button>
        </div>
      </div>

      {/* Account Financial Overview Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1.2fr", gap: 24, marginBottom: 32 }}>
        {/* Current Period Card */}
        <Card variant="bordered" style={{ padding: "28px 26px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-secondary)", textTransform: "uppercase", letterSpacing: ".06em" }}>
                Current Statement Period
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--color-ink)", marginTop: 4 }}>
                {currentPeriod}
              </div>
            </div>
            <span className="badge badge--success">
              <CheckCircle2 size={13} style={{ marginRight: 4 }} /> Current &amp; In Good Standing
            </span>
          </div>

          <div style={{ margin: "24px 0" }}>
            <div style={{ fontSize: 13, color: "var(--color-secondary)", marginBottom: 4 }}>
              Accrued usage this cycle
            </div>
            <div className="tabular" style={{ fontSize: 48, fontWeight: 700, color: "var(--color-ink)", lineHeight: 1 }}>
              {formatUsd(totalCents)}
            </div>
            <div style={{ fontSize: 13, color: "var(--color-secondary)", marginTop: 8 }}>
              {charges.length} successful residential searches billed at $4.00 each.
            </div>
          </div>

          <div
            style={{
              paddingTop: 16,
              borderTop: "1px solid var(--color-divider)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 13,
              color: "var(--color-secondary)",
            }}
          >
            <span>Statement Reference: <strong style={{ color: "var(--color-ink)" }}>{statementId}</strong></span>
            <span>Next invoice date: <strong>1st of next month</strong></span>
          </div>
        </Card>

        {/* Payment Method & Company Details */}
        <Card variant="bordered" style={{ padding: "28px 24px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Payment Method on File</h2>
              <span className="badge badge--blue">Default</span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "16px 18px",
                background: "var(--color-page)",
                borderRadius: "var(--radius-input)",
                border: "1px solid var(--color-divider)",
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 8,
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-divider)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--color-trust)",
                }}
              >
                <CreditCard size={22} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--color-ink)" }}>
                  Visa corporate card •••• 4242
                </div>
                <div style={{ fontSize: 12, color: "var(--color-secondary)", marginTop: 2 }}>
                  Expires 12/28 • Automatic clearing via Stripe
                </div>
              </div>
            </div>

            <div style={{ fontSize: 13, color: "var(--color-secondary)", lineHeight: 1.5 }}>
              Invoices are automatically settled against your default card on the 1st of each calendar month.
            </div>
          </div>

          <div style={{ paddingTop: 16, borderTop: "1px solid var(--color-divider)", fontSize: 12, color: "var(--color-secondary)" }}>
            Need invoice recipient or tax ID changes? Update them in <a href="/settings" style={{ color: "var(--color-trust)" }}>Settings</a>.
          </div>
        </Card>
      </div>

      {/* Itemized Transactions Table */}
      <Card variant="bordered" style={{ marginBottom: 32 }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--color-divider)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Itemized valuation transactions</h2>
            <div style={{ fontSize: 13, color: "var(--color-secondary)", marginTop: 2 }}>
              Only completed property valuations generate a line charge.
            </div>
          </div>
          <span style={{ fontSize: 13, color: "var(--color-secondary)" }}>
            {charges.length} record{charges.length === 1 ? "" : "s"}
          </span>
        </div>

        {charges.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--color-secondary)", fontSize: 14 }}>
            No transaction records accrued for the current cycle.
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Date &amp; Time</th>
                  <th>Transaction ID</th>
                  <th>Property Valuation Subject</th>
                  <th>Rate</th>
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
                    <td style={{ fontSize: 12, fontFamily: "monospace", color: "var(--color-secondary)" }}>
                      {c.id}
                    </td>
                    <td style={{ fontWeight: 600, color: "var(--color-ink)" }}>{c.address}</td>
                    <td className="tabular" style={{ fontWeight: 700 }}>
                      {formatUsd(c.amountCents)}
                    </td>
                    <td>
                      <Badge variant="success">Settled</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Historical Monthly Tax Statements */}
      <Card variant="bordered">
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--color-divider)" }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Historical Monthly Statements</h2>
          <div style={{ fontSize: 13, color: "var(--color-secondary)", marginTop: 2 }}>
            Official VAT/Sales tax compliant receipt statements for corporate records.
          </div>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Statement Period</th>
                <th>Invoice Number</th>
                <th>Total Billed</th>
                <th>Payment Status</th>
                <th style={{ textAlign: "right" }}>Official PDF</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 600 }}>October 2026</td>
                <td style={{ fontSize: 13, fontFamily: "monospace", color: "var(--color-secondary)" }}>
                  INV-2026-10-0391
                </td>
                <td className="tabular" style={{ fontWeight: 700 }}>$16.00 USD</td>
                <td>
                  <Badge variant="success">Paid in full</Badge>
                </td>
                <td style={{ textAlign: "right" }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownloadInvoice("October 2026", 1600, "INV-2026-10-0391")}
                  >
                    <Download size={14} /> Download PDF
                  </Button>
                </td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>September 2026</td>
                <td style={{ fontSize: 13, fontFamily: "monospace", color: "var(--color-secondary)" }}>
                  INV-2026-09-0248
                </td>
                <td className="tabular" style={{ fontWeight: 700 }}>$24.00 USD</td>
                <td>
                  <Badge variant="success">Paid in full</Badge>
                </td>
                <td style={{ textAlign: "right" }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownloadInvoice("September 2026", 2400, "INV-2026-09-0248")}
                  >
                    <Download size={14} /> Download PDF
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Subtle legal footnote */}
      <div style={{ marginTop: 24, fontSize: 12, color: "var(--color-secondary)", lineHeight: 1.5 }}>
        RealValue Technologies, Inc. is a provider of algorithmic residential valuation tools. Statements and reports do not constitute certified appraisals.
      </div>
    </div>
  );
}
