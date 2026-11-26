"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { HelpCircle, MessageSquare, AlertCircle, CheckCircle2, ExternalLink } from "lucide-react";

export default function HelpPage() {
  const toast = useToast();
  const [tab, setTab] = useState<"faq" | "contact" | "report-data">("faq");

  // Contact form
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactSent, setContactSent] = useState(false);

  // Report data form
  const [dataAddress, setDataAddress] = useState("");
  const [dataIssue, setDataIssue] = useState("");
  const [dataSubmitted, setDataSubmitted] = useState(false);

  function handleContactSubmit(e: React.FormEvent) {
    e.preventDefault();
    setContactSent(true);
    toast.success("Support inquiry sent. We will respond within 24 hours.");
  }

  function handleDataReportSubmit(e: React.FormEvent) {
    e.preventDefault();
    setDataSubmitted(true);
    toast.success("Thank you. Property record flagged for manual review.");
  }

  return (
    <div style={{ maxWidth: 760 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: "0 0 6px" }}>Help &amp; Support</h1>
        <p style={{ color: "var(--color-secondary)", fontSize: 15, margin: 0 }}>
          Find answers, report incorrect home facts, or contact our team.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, borderBottom: "1px solid var(--color-divider)", paddingBottom: 8 }}>
        <button
          type="button"
          onClick={() => setTab("faq")}
          className={`btn btn--sm ${tab === "faq" ? "btn--primary" : "btn--ghost"}`}
        >
          Frequently Asked Questions
        </button>
        <button
          type="button"
          onClick={() => setTab("contact")}
          className={`btn btn--sm ${tab === "contact" ? "btn--primary" : "btn--ghost"}`}
        >
          Contact Us
        </button>
        <button
          type="button"
          onClick={() => setTab("report-data")}
          className={`btn btn--sm ${tab === "report-data" ? "btn--primary" : "btn--ghost"}`}
        >
          Report Wrong Home Data
        </button>
      </div>

      {/* Tab 1: FAQ */}
      {tab === "faq" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[
            {
              q: "Is RealValue an appraisal?",
              a: "No. RealValue is a computer-generated statistical estimate based on comparable sales transactions. It is not an appraisal, and it cannot be used in place of one for lending, tax, or legal transactions.",
            },
            {
              q: "How does the pricing and billing work?",
              a: "Each successful new address valuation is $4.00 USD. Failed searches or addresses without sufficient evidence are never charged. You can reopen past searches from your History for free at any time.",
            },
            {
              q: "Where does the property data come from?",
              a: "We integrate with public tax assessor records, deed registries, and verified MLS transaction feeds provided by certified data aggregators.",
            },
            {
              q: "Can I review the underlying algorithm?",
              a: "Yes. Our Accuracy & Methodology page documents the distance/area/age similarity weighting and median reconciliation used in our calculations.",
            },
          ].map((item) => (
            <Card key={item.q} variant="bordered" style={{ padding: "20px 24px" }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 8px" }}>{item.q}</h2>
              <p style={{ color: "var(--color-secondary)", fontSize: 15, margin: 0, lineHeight: 1.5 }}>
                {item.a}
              </p>
            </Card>
          ))}

          <div style={{ marginTop: 12 }}>
            <Link href="/methodology" target="_blank" className="btn btn--secondary btn--sm">
              Read complete Methodology &rarr;
            </Link>
          </div>
        </div>
      )}

      {/* Tab 2: Contact Form */}
      {tab === "contact" && (
        <Card variant="bordered" style={{ padding: "28px 24px" }}>
          {contactSent ? (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <CheckCircle2 size={36} color="var(--color-success)" style={{ margin: "0 auto 12px" }} />
              <h2 style={{ fontSize: 20, marginBottom: 8 }}>Message received</h2>
              <p style={{ color: "var(--color-secondary)", fontSize: 14 }}>
                Thank you for reaching out. A product specialist will contact you at <strong>{contactEmail}</strong>.
              </p>
            </div>
          ) : (
            <form onSubmit={handleContactSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Send our team a message</h2>
              <Input
                label="Your name"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                required
                fullWidth
              />
              <Input
                label="Email address"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                required
                fullWidth
              />
              <div className="field">
                <label className="field__label">Message</label>
                <textarea
                  className="field__textarea"
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  placeholder="How can we help?"
                  required
                />
              </div>
              <Button type="submit" size="md">
                Send message
              </Button>
            </form>
          )}
        </Card>
      )}

      {/* Tab 3: Report Wrong Home Data */}
      {tab === "report-data" && (
        <Card variant="bordered" style={{ padding: "28px 24px" }}>
          {dataSubmitted ? (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <CheckCircle2 size={36} color="var(--color-success)" style={{ margin: "0 auto 12px" }} />
              <h2 style={{ fontSize: 20, marginBottom: 8 }}>Report submitted</h2>
              <p style={{ color: "var(--color-secondary)", fontSize: 14 }}>
                Thank you for flagging this property record. Our research team reviews data discrepancies against county recorder filings.
              </p>
            </div>
          ) : (
            <form onSubmit={handleDataReportSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Report incorrect property data</h2>
              <p style={{ color: "var(--color-secondary)", fontSize: 14, margin: 0 }}>
                If tax records show outdated square footage, bedroom count, or unrecorded renovations, let us know.
              </p>
              <Input
                label="Property address"
                value={dataAddress}
                onChange={(e) => setDataAddress(e.target.value)}
                placeholder="123 Example St, City, State ZIP"
                required
                fullWidth
              />
              <div className="field">
                <label className="field__label">What information is incorrect?</label>
                <textarea
                  className="field__textarea"
                  value={dataIssue}
                  onChange={(e) => setDataIssue(e.target.value)}
                  placeholder="e.g. The property was expanded by 400 sq ft in 2022 with permit #12345, or the bedroom count is 4 not 3."
                  required
                />
              </div>
              <Button type="submit" size="md">
                Submit correction report
              </Button>
            </form>
          )}
        </Card>
      )}
    </div>
  );
}
