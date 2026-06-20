/**
 * /settings — Settings Page (with REAL data from API)
 *
 * Previously this page had all hardcoded values. Now it fetches
 * real data from GET /api/user/profile and shows it.
 *
 * Settings vs. Profile:
 * - Profile (/profile): identity + learning preferences (inline editing)
 * - Settings (/settings): account management (sign out, notifications, danger zone)
 *
 * For now, settings shows a read-only view of the profile + sign out.
 * When we add notifications, password change, and account deletion,
 * those will go here.
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Globe,
  Target,
  Shield,
  CreditCard,
  LogOut,
  Crown,
  Bell,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";
import { ConfirmSignOutDialog } from "@/components/auth/confirm-sign-out";
import { SUPPORTED_LANGUAGES, PROFICIENCY_LEVELS } from "@/lib/constants";

interface UserProfile {
  name: string | null;
  email: string | null;
  nativeLanguage: string;
  targetLanguage: string | null;
  proficiencyLevel: string;
  isPro: boolean;
}

export default function SettingsPage() {
  const router = useRouter();
  const signOut = useAuthStore((s) => s.signOut);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/user/profile");
      const data = await res.json();
      if (res.ok && data.success) {
        setProfile(data.data);
      }
    } catch {
      // Silently fail — settings will show defaults
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
    router.refresh();
  };

  // Helper to display language name with flag
  const getLangDisplay = (code: string | null) => {
    if (!code) return "Not selected";
    const lang = SUPPORTED_LANGUAGES.find((l) => l.code === code);
    return lang ? `${lang.flagEmoji} ${lang.name}` : code;
  };

  // Helper to display proficiency level
  const getLevelDisplay = (level: string) => {
    return level.charAt(0).toUpperCase() + level.slice(1);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-8">
        <h1
          className="mb-2 text-2xl font-bold text-[var(--text-primary)] sm:text-3xl"
          style={{ fontFamily: "var(--font-heading-cfg)" }}
        >
          Settings
        </h1>
        <p className="text-[var(--text-secondary)]">
          Manage your profile, preferences, and subscription
        </p>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 rounded-2xl bg-[var(--bg-elevated)]" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* ─── Profile Section ─── */}
          <div className="overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)]">
            <div className="flex items-center gap-3 border-b border-[var(--border-default)] px-6 py-4">
              <User className="h-5 w-5 text-[var(--accent-primary)]" />
              <h2
                className="text-base font-semibold text-[var(--text-primary)]"
                style={{ fontFamily: "var(--font-heading-cfg)" }}
              >
                Profile
              </h2>
            </div>
            <div className="divide-y divide-[var(--border-default)]">
              <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <User className="h-4.5 w-4.5 text-[var(--text-muted)]" />
                  <span className="text-sm text-[var(--text-secondary)]">Display Name</span>
                </div>
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {profile?.name || "Not set"}
                </span>
              </div>
              <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-4.5 w-4.5 text-[var(--text-muted)]" />
                  <span className="text-sm text-[var(--text-secondary)]">Email</span>
                </div>
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {profile?.email || "—"}
                </span>
              </div>
              <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <User className="h-4.5 w-4.5 text-[var(--text-muted)]" />
                  <span className="text-sm text-[var(--text-secondary)]">Edit Profile</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/profile")}
                  className="text-sm text-[var(--accent-primary)] hover:text-[var(--accent-hover)]"
                >
                  Go to Profile
                </Button>
              </div>
            </div>
          </div>

          {/* ─── Learning Preferences ─── */}
          <div className="overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)]">
            <div className="flex items-center gap-3 border-b border-[var(--border-default)] px-6 py-4">
              <Globe className="h-5 w-5 text-[var(--accent-primary)]" />
              <h2
                className="text-base font-semibold text-[var(--text-primary)]"
                style={{ fontFamily: "var(--font-heading-cfg)" }}
              >
                Learning Preferences
              </h2>
            </div>
            <div className="divide-y divide-[var(--border-default)]">
              <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <Globe className="h-4.5 w-4.5 text-[var(--text-muted)]" />
                  <span className="text-sm text-[var(--text-secondary)]">Native Language</span>
                </div>
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {getLangDisplay(profile?.nativeLanguage || "en")}
                </span>
              </div>
              <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <Target className="h-4.5 w-4.5 text-[var(--text-muted)]" />
                  <span className="text-sm text-[var(--text-secondary)]">Target Language</span>
                </div>
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {getLangDisplay(profile?.targetLanguage || null)}
                </span>
              </div>
              <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <Target className="h-4.5 w-4.5 text-[var(--text-muted)]" />
                  <span className="text-sm text-[var(--text-secondary)]">Proficiency Level</span>
                </div>
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {getLevelDisplay(profile?.proficiencyLevel || "beginner")}
                </span>
              </div>
            </div>
          </div>

          {/* ─── Notifications (placeholder) ─── */}
          <div className="overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)]">
            <div className="flex items-center gap-3 border-b border-[var(--border-default)] px-6 py-4">
              <Bell className="h-5 w-5 text-[var(--accent-primary)]" />
              <h2
                className="text-base font-semibold text-[var(--text-primary)]"
                style={{ fontFamily: "var(--font-heading-cfg)" }}
              >
                Notifications
              </h2>
            </div>
            <div className="px-6 py-4">
              <p className="text-sm text-[var(--text-muted)]">
                Notification preferences coming soon. You&apos;ll be able to control email
                reminders, daily practice streak alerts, and more.
              </p>
            </div>
          </div>

          {/* ─── Subscription ─── */}
          <div className="overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)]">
            <div className="flex items-center gap-3 border-b border-[var(--border-default)] px-6 py-4">
              <CreditCard className="h-5 w-5 text-[var(--accent-primary)]" />
              <h2
                className="text-base font-semibold text-[var(--text-primary)]"
                style={{ fontFamily: "var(--font-heading-cfg)" }}
              >
                Subscription
              </h2>
            </div>
            <div className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {profile?.isPro ? "Pro Plan" : "Free Plan"}
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  {profile?.isPro
                    ? "Unlimited conversations & premium scenarios"
                    : "3 conversations per day, basic scenarios"}
                </p>
              </div>
              {!profile?.isPro && (
                <Button
                  size="sm"
                  className="gradient-conbolo h-8 rounded-lg border-0 px-4 text-xs text-white"
                >
                  <Crown className="mr-1 h-3.5 w-3.5" />
                  Upgrade to Pro
                </Button>
              )}
            </div>
          </div>

          {/* ─── Account (Danger Zone) ─── */}
          <div className="overflow-hidden rounded-2xl border border-[var(--state-error)]/20 bg-[var(--bg-surface)]">
            <div className="flex items-center gap-3 border-b border-[var(--border-default)] px-6 py-4">
              <Shield className="h-5 w-5 text-[var(--state-error)]" />
              <h2
                className="text-base font-semibold text-[var(--text-primary)]"
                style={{ fontFamily: "var(--font-heading-cfg)" }}
              >
                Account
              </h2>
            </div>
            <div className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">Sign Out</p>
                <p className="text-xs text-[var(--text-muted)]">
                  Sign out of your account on this device
                </p>
              </div>
              <ConfirmSignOutDialog onConfirm={handleSignOut}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-lg text-sm text-[var(--state-error)] hover:bg-[var(--state-error-light)]"
                >
                  <LogOut className="mr-1.5 h-4 w-4" />
                  Sign Out
                </Button>
              </ConfirmSignOutDialog>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
