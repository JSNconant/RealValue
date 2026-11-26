import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "80px 24px" }}>
      <Link href="/" className="btn btn--ghost btn--sm" style={{ marginBottom: 32, display: "inline-flex" }}>
        ← RealValue
      </Link>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          background: "#FFF8EB",
          border: "1px solid #EDCF8A",
          borderRadius: 99,
          padding: "4px 14px",
          fontSize: 12,
          fontWeight: 700,
          color: "#704000",
          marginBottom: 24,
        }}
      >
        Draft — pending legal review
      </div>
      <h1 style={{ marginBottom: 16 }}>Terms of Service</h1>
      <p style={{ color: "var(--color-secondary)", marginBottom: 40 }}>
        This is a placeholder. Our team is preparing the full terms of service.
      </p>
      {[
        {
          title: "Not an appraisal",
          body: "RealValue produces computer-generated estimates. These are not appraisals and cannot be used for lending, legal, tax, or investment decisions.",
        },
        {
          title: "No accuracy guarantee",
          body: "Estimates are experimental and may differ materially from actual market value. We do not guarantee accuracy and will publish validation results when complete.",
        },
        {
          title: "Account",
          body: "You are responsible for maintaining the security of your account. Do not share your password.",
        },
        {
          title: "Billing",
          body: "A charge applies per successful estimate. Failed searches are not charged. Billing terms will be completed before launch.",
        },
      ].map((s) => (
        <section key={s.title} style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 20, marginBottom: 10 }}>{s.title}</h2>
          <p style={{ color: "var(--color-secondary)" }}>{s.body}</p>
        </section>
      ))}
    </main>
  );
}
