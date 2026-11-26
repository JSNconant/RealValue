import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Methodology" };

export default function MethodologyPage() {
  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "80px 24px" }}>
      <Link href="/" className="btn btn--ghost btn--sm" style={{ marginBottom: 32, display: "inline-flex" }}>
        ← RealValue
      </Link>
      <h1 style={{ marginBottom: 8 }}>Accuracy &amp; Methodology</h1>
      <p style={{ color: "var(--color-secondary)", marginBottom: 40 }}>
        How RealValue estimates home values, and what it cannot see.
      </p>
      {[
        {
          title: "What we estimate",
          body: "The cash-equivalent exchange price for an arm's-length residential sale under ordinary terms, as of today's date.",
        },
        {
          title: "How it's calculated",
          body: "We locate recent closed sales of similar residential properties within 10 miles. Each comparable is weighted by distance, living area, age, lot size, and recency. The estimate is the weighted median of those sale prices. We do not invent adjustments for factors we cannot observe.",
        },
        {
          title: "Validation status",
          body: "Current estimates carry an Experimental label because the model has not completed held-out backtesting. We will publish median absolute percentage error (MdAPE), within-5% and within-10% rates, and subgroup results when that work is complete. [Placeholder — to be completed by our team]",
          placeholder: true,
        },
        {
          title: "What we can't see",
          body: "Interior condition, unreported renovations, seller concessions, unique architectural features, and local micro-market nuance. These can materially affect value. A licensed appraiser conducts a physical inspection; we do not.",
        },
        {
          title: "Data sources",
          body: "Provider-reported property records and comparable sale transactions. All source records used in a calculation are shown in the report. We do not use race, ethnicity, religion, sex, or any protected characteristic in our estimates.",
        },
      ].map((s) => (
        <section key={s.title} style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 20, marginBottom: 10 }}>{s.title}</h2>
          <p style={{ color: "var(--color-secondary)", margin: 0 }}>
            {s.body}
            {s.placeholder && (
              <span
                style={{
                  display: "inline-flex",
                  marginLeft: 8,
                  background: "#FFF8EB",
                  border: "1px solid #EDCF8A",
                  borderRadius: 99,
                  padding: "2px 10px",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#704000",
                  verticalAlign: "middle",
                }}
              >
                Pending
              </span>
            )}
          </p>
        </section>
      ))}
    </main>
  );
}
