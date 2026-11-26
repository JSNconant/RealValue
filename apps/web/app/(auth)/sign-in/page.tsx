"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { useAuth } from "../../../lib/auth-context";
import { useToast } from "../../../components/ui/Toast";
import { ArrowRight } from "lucide-react";

export default function SignInPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const toast = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
      toast.success("Welcome back!");

      // If user came from a pending address search, direct to search confirm/report
      const pendingAddress = typeof window !== "undefined" ? sessionStorage.getItem("rv:pending-address") : null;
      if (pendingAddress) {
        sessionStorage.removeItem("rv:pending-address");
        router.push(`/search?q=${encodeURIComponent(pendingAddress)}`);
      } else {
        router.push("/dashboard");
      }
    } catch {
      // Honest generic message: Never reveal whether an email already has an account
      setError("Invalid email or password. Please check your credentials and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Sign in to RealValue</h1>
        <p style={{ color: "var(--color-secondary)", fontSize: 15, margin: 0 }}>
          Access your property searches, saved homes, and downloaded reports.
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
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="•••••••••••••••"
            required
            fullWidth
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 10,
              fontSize: 14,
            }}
          >
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", color: "var(--color-secondary)" }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ accentColor: "var(--color-trust)" }}
              />
              Remember me
            </label>
            <Link href="/forgot-password" style={{ color: "var(--color-trust)", textDecoration: "none" }}>
              Forgot password?
            </Link>
          </div>
        </div>

        <Button type="submit" variant="primary" size="lg" loading={loading} fullWidth style={{ marginTop: 8 }}>
          Sign in
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
        Don&apos;t have an account?{" "}
        <Link href="/sign-up" style={{ color: "var(--color-trust)", fontWeight: 600 }}>
          Create account
        </Link>
      </div>
    </div>
  );
}
