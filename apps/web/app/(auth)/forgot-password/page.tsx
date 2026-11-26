"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { requestPasswordReset } from "../../../lib/auth";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      // Security rule: Never reveal whether an email already has an account
      await requestPasswordReset(email);
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Link
        href="/sign-in"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 14,
          color: "var(--color-secondary)",
          textDecoration: "none",
          marginBottom: 24,
        }}
      >
        <ArrowLeft size={16} /> Back to Sign in
      </Link>

      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 8 }}>Reset your password</h1>
      <p style={{ color: "var(--color-secondary)", fontSize: 15, marginBottom: 24 }}>
        Enter your account email and we will send you instructions to reset your password.
      </p>

      {submitted ? (
        <div style={{ textAlign: "center", padding: "16px 0" }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "var(--color-success-bg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <CheckCircle2 size={24} color="var(--color-success)" />
          </div>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>Check your inbox</h2>
          <p style={{ color: "var(--color-secondary)", fontSize: 14, lineHeight: 1.5 }}>
            If an account exists for <strong style={{ color: "var(--color-ink)" }}>{email}</strong>,
            you will receive a password reset link shortly.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <Input
            label="Email address"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            required
            fullWidth
          />

          <Button type="submit" variant="primary" size="lg" loading={loading} fullWidth>
            Send reset instructions
          </Button>
        </form>
      )}
    </div>
  );
}
