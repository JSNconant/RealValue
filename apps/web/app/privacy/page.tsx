import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
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
      <h1 style={{ marginBottom: 16 }}>Privacy Policy</h1>
      <p style={{ color: "var(--color-secondary)", marginBottom: 40 }}>
        This is a placeholder. Our team is preparing the full privacy policy.
      </p>
      {[
        {
          title: "What we collect",
          body: "Your email address, the addresses you search, and usage records for billing. We do not collect income, credit history, race, ethnicity, religion, sex, or any federally protected characteristic.",
        },
        {
          title: "How we use it",
          body: "To provide the valuation service, to send you account emails (via Resend when activated), and to calculate your bill. We do not sell your data or share searches with third parties.",
        },
        {
          title: "Data retention",
          body: "You can export or delete your account at any time from Settings. This section will be completed with specific retention periods before launch.",
        },
        {
          title: "Contact",
          body: "Questions? Email hello@realvalue.app.",
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
