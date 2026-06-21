"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SocialAuthButtons } from "@/components/auth/social-auth-buttons";

export function LoginForm() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message || "Invalid email or password.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
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
          Welcome back
        </h1>
        <p className="text-[var(--text-secondary)]">Continue your learning journey</p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-[var(--state-error)]/30 bg-[var(--state-error-light)] p-4 text-sm text-[var(--state-error)]">
          {error}
        </div>
      )}

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
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-[var(--text-primary)]"
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-[var(--accent-primary)] transition-colors hover:text-[var(--accent-hover)]"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] py-2.5 pr-11 pl-10 text-sm text-[var(--text-primary)] transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/30 focus:outline-none"
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute top-1/2 right-3.5 -translate-y-1/2 text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)]"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={loading}
          size="lg"
          className="gradient-conbolo h-12 w-full rounded-xl border-0 text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign In"}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[var(--border-default)]" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-[var(--bg-base)] px-3 text-[var(--text-muted)]">
            or continue with
          </span>
        </div>
      </div>

      <SocialAuthButtons />

      <p className="mt-8 text-center text-sm text-[var(--text-secondary)]">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="font-medium text-[var(--accent-primary)] transition-colors hover:text-[var(--accent-hover)]"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
