import type { Metadata } from "next";
import Link from "next/link";
import { Home } from "lucide-react";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-page)",
        padding: 24,
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 480 }}>
        <div
          style={{
            fontSize: 120,
            fontWeight: 800,
            color: "var(--color-divider)",
            lineHeight: 1,
            letterSpacing: "-0.04em",
            marginBottom: 24,
          }}
        >
          404
        </div>
        <h1 style={{ fontSize: 28, marginBottom: 12 }}>
          Page not found
        </h1>
        <p
          style={{
            color: "var(--color-secondary)",
            marginBottom: 36,
            marginInline: "auto",
          }}
        >
          The page you&apos;re looking for doesn&apos;t exist or has moved.
        </p>
        <Link href="/" className="btn btn--primary btn--lg">
          <Home size={18} aria-hidden />
          Back to RealValue
        </Link>
      </div>
    </main>
  );
}
