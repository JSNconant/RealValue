"use client";

import { useState, Suspense, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { resetPassword, validatePassword, passwordErrorMessage } from "../../../lib/auth";
import { useToast } from "../../../components/ui/Toast";
import { Check, CheckCircle2 } from "lucide-react";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "demo-token";
  const toast = useToast();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const pwErrorKey = password.length > 0 ? validatePassword(password) : null;
  const pwErrorText = pwErrorKey ? passwordErrorMessage(pwErrorKey) : "";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    const pwValidation = validatePassword(password);
    if (pwValidation) {
      setError(passwordErrorMessage(pwValidation));
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, password);
      setSuccess(true);
      toast.success("Password updated successfully.");
      setTimeout(() => router.push("/sign-in"), 1800);
    } catch {
      setError("Unable to reset password. The link may have expired.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
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
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Password updated</h1>
        <p style={{ color: "var(--color-secondary)", fontSize: 14, marginBottom: 24 }}>
          Your password has been changed. Redirecting you to sign in…
        </p>
        <Link href="/sign-in">
          <Button variant="primary" fullWidth>
            Sign in now
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 8 }}>Set new password</h1>
      <p style={{ color: "var(--color-secondary)", fontSize: 15, marginBottom: 24 }}>
        Choose a strong password with at least 15 characters.
      </p>

      {error && (
        <div
          role="alert"
          style={{
            padding: "12px 16px",
            background: "var(--color-error-bg)",
            border: "1px solid var(--color-error-border)",
            borderRadius: "var(--radius-input)",
            color: "var(--color-error)",
            fontSize: 14,
            marginBottom: 20,
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div>
          <Input
            label="New password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 15 characters"
            required
            fullWidth
            hint="Minimum 15 characters. Spaces and phrases are welcome."
            error={password.length >= 15 && pwErrorText ? pwErrorText : undefined}
          />

          <div
            style={{
              marginTop: 6,
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              gap: 6,
              color: password.length >= 15 ? "var(--color-success)" : "var(--color-secondary)",
            }}
          >
            {password.length >= 15 ? (
              <>
                <Check size={14} color="var(--color-success)" />
                <span>Length requirement met ({password.length} characters)</span>
              </>
            ) : (
              <span>{15 - password.length > 0 ? `${15 - password.length} more characters needed` : ""}</span>
            )}
          </div>
        </div>

        <Input
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Repeat new password"
          required
          fullWidth
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={loading}
          disabled={password.length < 15 || password !== confirmPassword}
          fullWidth
          style={{ marginTop: 8 }}
        >
          Update password
        </Button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
