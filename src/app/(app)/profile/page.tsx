/**
 * /profile — User Profile Page
 *
 * Shows the user's profile with real data from the shared profile store.
 * Name is editable inline. Languages are DISPLAY-ONLY (change on Dashboard).
 *
 * Language switching pattern (Duolingo-style):
 * - ALL language changes happen on the Dashboard (Language Card)
 * - This page shows languages as read-only badges + "Change on Dashboard" link
 * - This prevents the scattered language switcher problem
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
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
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/stores/auth-store";
import { useProfileStore, useTargetLanguage, useNativeLanguage } from "@/stores/profile-store";
import { SUPPORTED_LANGUAGES, PROFICIENCY_LEVELS } from "@/lib/constants";

// ═══════════════════════════════════════════
// Editable Field Component (for name only)
// ═══════════════════════════════════════════

function EditableField({
  label,
  value,
  icon: Icon,
  onSave,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  onSave: (newValue: string) => Promise<void>;
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
      setEditValue(value);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

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
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            autoFocus
            className="w-48 rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] px-3 py-1.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)]"
          />
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
  const user = useAuthStore((s) => s.user);
  const authLoading = useAuthStore((s) => s.isLoading);

  // Profile from shared store
  const profile = useProfileStore((s) => s.profile);
  const fetchProfile = useProfileStore((s) => s.fetchProfile);
  const updateProfile = useProfileStore((s) => s.updateProfile);
  const isProfileInitialized = useProfileStore((s) => s.isInitialized);
  const targetLang = useTargetLanguage();
  const nativeLang = useNativeLanguage();

  // ─── Fetch profile on mount ───
  useEffect(() => {
    if (!isProfileInitialized) {
      fetchProfile();
    }
  }, [isProfileInitialized, fetchProfile]);

  // ─── Save name (updates shared store) ───
  const handleSaveName = useCallback(
    async (name: string) => {
      await updateProfile({ name });
    },
    [updateProfile]
  );

  // ─── Loading state ───
  if (!isProfileInitialized || authLoading) {
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

  if (!profile) return null;

  const displayName = profile.name || user?.user_metadata?.name || "Set your name";
  const displayInitial = (profile.name || user?.email || "?")[0]?.toUpperCase() || "?";
  const level = profile.proficiencyLevel || "beginner";

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
            onSave={handleSaveName}
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

      {/* ─── Learning Preferences — DISPLAY ONLY ─── */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)]">
        <div className="flex items-center justify-between border-b border-[var(--border-default)] px-6 py-4">
          <div className="flex items-center gap-3">
            <Globe className="h-5 w-5 text-[var(--accent-primary)]" />
            <h2
              className="text-base font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-heading-cfg)" }}
            >
              Learning Preferences
            </h2>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 text-xs font-medium text-[var(--accent-primary)] hover:text-[var(--accent-hover)]"
          >
            Change on Dashboard
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
        <div className="divide-y divide-[var(--border-default)]">
          {/* Native language — read-only badge */}
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <Globe className="h-4.5 w-4.5 text-[var(--text-muted)]" />
              <span className="text-sm text-[var(--text-secondary)]">Native Language</span>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--bg-elevated)] px-3 py-1 text-sm font-medium text-[var(--text-primary)]">
              {nativeLang.flagEmoji} {nativeLang.name}
            </span>
          </div>

          {/* Target language — read-only badge */}
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <Target className="h-4.5 w-4.5 text-[var(--text-muted)]" />
              <span className="text-sm text-[var(--text-secondary)]">Target Language</span>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent-light)] px-3 py-1 text-sm font-medium text-[var(--accent-primary)]">
              {targetLang.flagEmoji} {targetLang.name}
            </span>
          </div>

          {/* Proficiency level — read-only badge */}
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <Target className="h-4.5 w-4.5 text-[var(--text-muted)]" />
              <span className="text-sm text-[var(--text-secondary)]">Proficiency Level</span>
            </div>
            <span className="inline-flex items-center rounded-full bg-[var(--bg-elevated)] px-3 py-1 text-sm text-[var(--text-secondary)] capitalize">
              {level}
            </span>
          </div>
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
            <Link href="/pricing">
              <Button
                size="sm"
                className="gradient-conbolo h-8 rounded-lg border-0 px-4 text-xs text-white"
              >
                <Crown className="mr-1 h-3.5 w-3.5" />
                Upgrade
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
