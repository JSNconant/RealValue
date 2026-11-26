"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { useAuth } from "../../../lib/auth-context";
import { validatePassword, passwordErrorMessage } from "../../../lib/auth";
import { useToast } from "../../../components/ui/Toast";
import { ArrowRight, Check } from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const toast = useToast();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const pwErrorKey = password.length > 0 ? validatePassword(password) : null;
  const pwErrorText = pwErrorKey ? passwordErrorMessage(pwErrorKey) : "";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!agreed) {
      setError("Please agree to the Terms of Service and Privacy Policy to continue.");
      return;
    }

    const pwValidation = validatePassword(password);
    if (pwValidation) {
      setError(passwordErrorMessage(pwValidation));
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, fullName);
      toast.success("Account created successfully!");

      // If email verification gate is enabled via env, go to verify screen
      if (process.env.NEXT_PUBLIC_VERIFY_EMAIL === "true") {
        router.push(`/verify?email=${encodeURIComponent(email)}`);
      } else {
        // Direct transition: if pending address from hero exists, carry it to search
        const pendingAddress = typeof window !== "undefined" ? sessionStorage.getItem("rv:pending-address") : null;
        if (pendingAddress) {
          sessionStorage.removeItem("rv:pending-address");
          router.push(`/search?q=${encodeURIComponent(pendingAddress)}`);
        } else {
          router.push("/dashboard");
        }
      }
    } catch {
      setError("Unable to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Create your account</h1>
        <p style={{ color: "var(--color-secondary)", fontSize: 15, margin: 0 }}>
          Start searching property values with transparent comparable evidence.
        </p>
      </div>

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
        <Input
          label="Full name"
          type="text"
          autoComplete="name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Jane Doe"
          required
          fullWidth
        />

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

        <div>
          <Input
            label="Password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 15 characters"
            required
            fullWidth
            hint="Minimum 15 characters. Spaces, phrases and password managers welcome."
            error={password.length >= 15 && pwErrorText ? pwErrorText : undefined}
          />

          {/* Real-time length helper */}
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

        <div style={{ marginTop: 4 }}>
          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              fontSize: 14,
              color: "var(--color-secondary)",
              lineHeight: 1.4,
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              required
              style={{ marginTop: 3, accentColor: "var(--color-trust)" }}
            />
            <span>
              I agree to the{" "}
              <Link href="/terms" target="_blank" style={{ color: "var(--color-trust)" }}>
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" target="_blank" style={{ color: "var(--color-trust)" }}>
                Privacy Policy
              </Link>
              .
            </span>
          </label>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={loading}
          disabled={password.length < 15 || !agreed}
          fullWidth
          style={{ marginTop: 8 }}
        >
          Create account
          <ArrowRight size={18} aria-hidden />
        </Button>
      </form>

      <div
        style={{
          marginTop: 28,
          paddingTop: 20,
          borderTop: "1px solid var(--color-divider)",
          textAlign: "center",
          fontSize: 15,
          color: "var(--color-secondary)",
        }}
      >
        Already have an account?{" "}
        <Link href="/sign-in" style={{ color: "var(--color-trust)", fontWeight: 600 }}>
          Sign in
        </Link>
      </div>
    </div>
  );
}
