/**
 * /profile — User Profile Page
 *
 * Shows the user's full profile with real data from the API.
 * Also allows editing name and learning preferences.
 *
 * WHY A DEDICATED PROFILE PAGE?
 * - The settings page is for account management (password, notifications, danger zone)
 * - The profile page is for identity + learning preferences (name, languages, level)
 * - Separation of concerns: identity stuff vs. account security stuff
 * - A "profile" link in the navbar feels more natural than "settings"
 *
 * HOW IT WORKS:
 * 1. On mount, fetches GET /api/user/profile for real data
 * 2. Shows a loading skeleton while fetching
 * 3. Displays profile in editable sections
 * 4. On save, calls PUT /api/user/profile (we'll build this)
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Globe,
  Target,
  Crown,
  Edit3,
  Check,
  X,
  Loader2,
  Flame,
  Zap,
  MessageSquare,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/stores/auth-store";
import { SUPPORTED_LANGUAGES, PROFICIENCY_LEVELS } from "@/lib/constants";

// ═══════════════════════════════════════════
// Types
// ═══════════════════════════════════════════

interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  nativeLanguage: string;
  targetLanguage: string | null;
  proficiencyLevel: string;
  isPro: boolean;
}

// ═══════════════════════════════════════════
// Editable Field Component
// ═══════════════════════════════════════════

/**
 * EditableField — Shows a value that can be toggled into edit mode.
 *
 * WHY: Instead of a full form, we use inline editing.
 * It's faster to use and feels more modern. Click the edit
 * icon → the field turns into an input → save or cancel.
 */
function EditableField({
  label,
  value,
  icon: Icon,
  onSave,
  type = "text",
  options,
  isLoading,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  onSave: (newValue: string) => Promise<void>;
  type?: "text" | "select";
  options?: { value: string; label: string }[];
  isLoading?: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    try {
      await onSave(editValue);
      setIsEditing(false);
    } catch {
      // Revert on error
      setEditValue(value);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  // Sync external value changes
  useEffect(() => {
    setEditValue(value);
  }, [value]);

  return (
    <div className="flex items-center justify-between px-6 py-4">
      <div className="flex items-center gap-3">
        <Icon className="h-4.5 w-4.5 text-[var(--text-muted)]" />
        <span className="text-sm text-[var(--text-secondary)]">{label}</span>
      </div>

      {isEditing ? (
        <div className="flex items-center gap-2">
          {type === "select" && options ? (
            <select
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] px-3 py-1.5 text-sm text-[var(--text-primary)]"
            >
              {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              autoFocus
              className="w-48 rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] px-3 py-1.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)]"
            />
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-lg p-1.5 text-[var(--state-success)] hover:bg-[var(--state-success-light)]"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="rounded-lg p-1.5 text-[var(--state-error)] hover:bg-[var(--state-error-light)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[var(--text-primary)]">{value || "—"}</span>
          <button
            onClick={() => setIsEditing(true)}
            className="rounded-lg p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-secondary)]"
          >
            <Edit3 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════

export default function ProfilePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const authLoading = useAuthStore((s) => s.isLoading);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ─── Fetch profile data ───
  const fetchProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch("/api/user/profile");
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to load profile");
      }

      setProfile(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // ─── Save a profile field ───
  const handleSaveField = async (field: string, value: string | null) => {
    const res = await fetch("/api/user/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || "Failed to update");
    }

    // Update local state
    setProfile((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  // ─── Loading state ───
  if (isLoading || authLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="animate-pulse space-y-6">
          <div className="flex items-center gap-6">
            <div className="h-20 w-20 rounded-full bg-[var(--bg-elevated)]" />
            <div className="space-y-2">
              <div className="h-6 w-40 rounded-lg bg-[var(--bg-elevated)]" />
              <div className="h-4 w-56 rounded-lg bg-[var(--bg-elevated)]" />
            </div>
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 rounded-2xl bg-[var(--bg-elevated)]" />
          ))}
        </div>
      </div>
    );
  }

  // ─── Error state ───
  if (error && !profile) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="rounded-2xl border border-[var(--state-error)]/20 bg-[var(--bg-surface)] p-8 text-center">
          <p className="mb-2 text-base font-semibold text-[var(--text-primary)]">
            Failed to load profile
          </p>
          <p className="mb-4 text-sm text-[var(--text-muted)]">{error}</p>
          <Button onClick={fetchProfile} variant="outline" size="sm">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  // Get display info
  const displayName = profile.name || user?.user_metadata?.name || "Set your name";
  const displayInitial = (profile.name || user?.email || "?")[0]?.toUpperCase() || "?";
  const nativeLang = SUPPORTED_LANGUAGES.find((l) => l.code === profile.nativeLanguage);
  const targetLang = SUPPORTED_LANGUAGES.find((l) => l.code === profile.targetLanguage);

  // Language options for selects
  const languageOptions = SUPPORTED_LANGUAGES.map((l) => ({
    value: l.code,
    label: `${l.flagEmoji} ${l.name}`,
  }));

  const levelOptions = PROFICIENCY_LEVELS.map((l) => ({
    value: l,
    label: l.charAt(0).toUpperCase() + l.slice(1),
  }));

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* ─── Profile Header ─── */}
      <div className="mb-8 flex items-center gap-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--accent-primary)] text-2xl font-bold text-white">
          {displayInitial}
        </div>
        <div>
          <h1
            className="text-2xl font-bold text-[var(--text-primary)] sm:text-3xl"
            style={{ fontFamily: "var(--font-heading-cfg)" }}
          >
            {displayName}
          </h1>
          <p className="text-sm text-[var(--text-muted)]">{profile.email}</p>
          {profile.isPro && (
            <Badge className="mt-1.5 bg-[var(--color-gold-light)] text-xs text-[var(--color-gold)]">
              <Crown className="mr-1 h-3 w-3" />
              Pro Member
            </Badge>
          )}
        </div>
      </div>

      {/* ─── Quick Stats ─── */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            icon: MessageSquare,
            label: "Conversations",
            value: "0",
            color: "text-[var(--accent-primary)]",
            bg: "bg-[var(--accent-light)]",
          },
          {
            icon: BookOpen,
            label: "Words Learned",
            value: "0",
            color: "text-[var(--accent-secondary)]",
            bg: "bg-[var(--accent-secondary-light)]",
          },
          {
            icon: Flame,
            label: "Day Streak",
            value: "0",
            color: "text-[var(--color-gold)]",
            bg: "bg-[var(--color-gold-light)]",
          },
          {
            icon: Zap,
            label: "XP Points",
            value: "0",
            color: "text-[var(--state-success)]",
            bg: "bg-[var(--bg-elevated)]",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-3 text-center"
          >
            <stat.icon className={`mx-auto mb-1.5 h-5 w-5 ${stat.color}`} />
            <p className="text-lg font-bold text-[var(--text-primary)]">{stat.value}</p>
            <p className="text-[10px] text-[var(--text-muted)]">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ─── Personal Info ─── */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)]">
        <div className="flex items-center gap-3 border-b border-[var(--border-default)] px-6 py-4">
          <User className="h-5 w-5 text-[var(--accent-primary)]" />
          <h2
            className="text-base font-semibold text-[var(--text-primary)]"
            style={{ fontFamily: "var(--font-heading-cfg)" }}
          >
            Personal Info
          </h2>
        </div>
        <div className="divide-y divide-[var(--border-default)]">
          <EditableField
            label="Display Name"
            value={profile.name || ""}
            icon={User}
            onSave={(v) => handleSaveField("name", v)}
          />
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <Mail className="h-4.5 w-4.5 text-[var(--text-muted)]" />
              <span className="text-sm text-[var(--text-secondary)]">Email</span>
            </div>
            <span className="text-sm font-medium text-[var(--text-primary)]">{profile.email}</span>
          </div>
        </div>
      </div>

      {/* ─── Learning Preferences ─── */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)]">
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
          <EditableField
            label="Native Language"
            value={
              nativeLang ? `${nativeLang.flagEmoji} ${nativeLang.name}` : profile.nativeLanguage
            }
            icon={Globe}
            type="select"
            options={languageOptions}
            onSave={(v) => handleSaveField("nativeLanguage", v)}
          />
          <EditableField
            label="Target Language"
            value={
              targetLang
                ? `${targetLang.flagEmoji} ${targetLang.name}`
                : profile.targetLanguage || ""
            }
            icon={Target}
            type="select"
            options={[{ value: "", label: "Not selected" }, ...languageOptions]}
            onSave={(v) => handleSaveField("targetLanguage", v || null)}
          />
          <EditableField
            label="Proficiency Level"
            value={
              profile.proficiencyLevel.charAt(0).toUpperCase() + profile.proficiencyLevel.slice(1)
            }
            icon={Target}
            type="select"
            options={levelOptions}
            onSave={(v) => handleSaveField("proficiencyLevel", v)}
          />
        </div>
      </div>

      {/* ─── Subscription ─── */}
      <div className="overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)]">
        <div className="flex items-center gap-3 border-b border-[var(--border-default)] px-6 py-4">
          <Crown className="h-5 w-5 text-[var(--color-gold)]" />
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
              {profile.isPro ? "Pro Plan" : "Free Plan"}
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              {profile.isPro
                ? "Unlimited conversations & premium scenarios"
                : "3 conversations per day, basic scenarios"}
            </p>
          </div>
          {!profile.isPro && (
            <Button
              size="sm"
              className="gradient-conbolo h-8 rounded-lg border-0 px-4 text-xs text-white"
            >
              <Crown className="mr-1 h-3.5 w-3.5" />
              Upgrade
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
