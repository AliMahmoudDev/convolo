"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error?.message || "Something went wrong. Please try again.");
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1
          className="mb-2 text-2xl font-bold text-[var(--text-primary)] sm:text-3xl"
          style={{ fontFamily: "var(--font-heading-cfg)" }}
        >
          Forgot your password?
        </h1>
        <p className="text-[var(--text-secondary)]">
          {submitted
            ? "Check your inbox for a reset link."
            : "No worries — enter your email and we'll send you a reset link."}
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-[var(--state-error)]/30 bg-[var(--state-error-light)] p-4 text-sm text-[var(--state-error)]">
          {error}
        </div>
      )}

      {submitted ? (
        <div className="space-y-6">
          <div className="flex flex-col items-center gap-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-base)] p-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-7 w-7 text-green-600" />
            </div>
            <div>
              <h2 className="mb-1 text-lg font-semibold text-[var(--text-primary)]">
                Email sent!
              </h2>
              <p className="text-sm text-[var(--text-secondary)]">
                If an account with <strong>{email}</strong> exists, you&apos;ll receive a
                password reset link shortly.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => {
                setSubmitted(false);
                setEmail("");
              }}
              variant="outline"
              className="w-full rounded-xl"
            >
              Send another reset link
            </Button>

            <Link href="/login">
              <Button variant="ghost" className="w-full rounded-xl">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to sign in
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
            >
              Email address
            </label>
            <div className="relative">
              <Mail className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] py-2.5 pr-4 pl-10 text-sm text-[var(--text-primary)] transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/30 focus:outline-none"
                placeholder="you@example.com"
                autoFocus
              />
            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={loading}
            size="lg"
            className="gradient-conbolo h-12 w-full rounded-xl border-0 text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Send Reset Link"}
          </Button>

          <Link
            href="/login"
            className="flex items-center justify-center gap-2 text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--accent-primary)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>
        </form>
      )}
    </div>
  );
}
