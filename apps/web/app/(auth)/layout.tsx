import Link from "next/link";
import { type ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--color-page)",
      }}
    >
      {/* Minimal top bar */}
      <header
        style={{
          padding: "24px var(--sp-4)",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Link
          href="/"
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: "var(--color-ink)",
            letterSpacing: "-0.02em",
            textDecoration: "none",
          }}
        >
          RealValue
        </Link>
      </header>

      {/* Centered card container */}
      <main
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px 16px 64px",
        }}
      >
        <div
          className="card"
          style={{
            width: "100%",
            maxWidth: 460,
            padding: "40px 36px",
            boxShadow: "var(--shadow-raised)",
            border: "1.5px solid var(--color-divider)",
          }}
        >
          {children}
        </div>
      </main>

      {/* Quiet footer disclaimer */}
      <footer
        style={{
          padding: "20px var(--sp-3)",
          textAlign: "center",
          fontSize: 13,
          color: "var(--color-secondary)",
        }}
      >
        This is a computer-generated estimate, not an appraisal, and cannot be used in place of one.
      </footer>
    </div>
  );
}
