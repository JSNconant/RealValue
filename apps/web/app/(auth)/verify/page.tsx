"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "../../../components/ui/Button";
import { Mail, CheckCircle2 } from "lucide-react";
import { useToast } from "../../../components/ui/Toast";

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "your email";
  const toast = useToast();

  const [resending, setResending] = useState(false);
  const [resurfaced, setResurfaced] = useState(false);

  async function handleResend() {
    setResending(true);
    // Simulating Resend API trigger
    setTimeout(() => {
      setResending(false);
      setResurfaced(true);
      toast.info("A new verification link has been sent.");
    }, 800);
  }

  function handleContinue() {
    // If pending address exists, carry it over
    const pendingAddress = typeof window !== "undefined" ? sessionStorage.getItem("rv:pending-address") : null;
    if (pendingAddress) {
      sessionStorage.removeItem("rv:pending-address");
      router.push(`/search?q=${encodeURIComponent(pendingAddress)}`);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "var(--color-blue-tint)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 24px",
        }}
      >
        <Mail size={26} color="var(--color-trust)" />
      </div>

      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 12 }}>Check your email</h1>
      <p style={{ color: "var(--color-secondary)", fontSize: 15, marginBottom: 24, lineHeight: 1.5 }}>
        We sent a verification link to <strong style={{ color: "var(--color-ink)" }}>{email}</strong>.
        Click the link to verify your account.
      </p>

      {resurfaced && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 16px",
            background: "var(--color-success-bg)",
            color: "var(--color-success)",
            borderRadius: "var(--radius-pill)",
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 20,
          }}
        >
          <CheckCircle2 size={16} /> Verification email resent
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
        <Button variant="primary" size="lg" fullWidth onClick={handleContinue}>
          Continue to RealValue
        </Button>
        <Button variant="secondary" size="md" fullWidth loading={resending} onClick={handleResend}>
          Resend email
        </Button>
      </div>

      <div
        style={{
          marginTop: 28,
          paddingTop: 20,
          borderTop: "1px solid var(--color-divider)",
          fontSize: 14,
          color: "var(--color-secondary)",
        }}
      >
        Wrong email?{" "}
        <Link href="/sign-up" style={{ color: "var(--color-trust)", fontWeight: 600 }}>
          Create another account
        </Link>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <VerifyContent />
    </Suspense>
  );
}
