/**
 * Profile Store — Zustand-based global user profile state.
 *
 * WHY A PROFILE STORE?
 * ─────────────────
 * Without it, each page fetches the profile independently via API.
 * When the user changes their target language on the Dashboard,
 * the Learn page still shows the old value until it re-fetches.
 *
 * This store ensures:
 * 1. Single source of truth for profile data (nativeLanguage, targetLanguage, etc.)
 * 2. Language changes propagate instantly across all pages
 * 3. No redundant API calls — fetch once, share everywhere
 * 4. Optimistic updates — UI updates immediately, API call in background
 *
 * LANGUAGE SWITCHING PATTERN (Duolingo-style):
 * ──────────────────────────────────────────
 * - Target language: Changed on the Dashboard (Language Card) → updates here
 * - Native language: Changed on the Dashboard → updates here
 * - Learn page: Reads from this store, changes update profile immediately
 * - Chat: Display-only, no switching mid-conversation
 * - Interface language: Settings only (future feature)
 */

import { create } from "zustand";
import { SUPPORTED_LANGUAGES, type ProficiencyLevel } from "@/lib/constants";

// ═══════════════════════════════════════════
// Types
// ═══════════════════════════════════════════

export interface ProfileData {
  id: string;
  name: string;
  email: string;
  nativeLanguage: string;
  targetLanguage: string | null;
  proficiencyLevel: ProficiencyLevel;
  isPro: boolean;
}

interface ProfileState {
  /** The user's profile, or null if not loaded yet */
  profile: ProfileData | null;
  /** Whether we're currently fetching the profile */
  isLoading: boolean;
  /** Whether the profile has been fetched at least once */
  isInitialized: boolean;
}

interface ProfileActions {
  /** Fetch the profile from the API (GET /api/user/profile) */
  fetchProfile: () => Promise<ProfileData | null>;
  /** Update the profile via API and update the store (PUT /api/user/profile) */
  updateProfile: (
    updates: Partial<
      Pick<ProfileData, "name" | "nativeLanguage" | "targetLanguage" | "proficiencyLevel">
    >
  ) => Promise<ProfileData | null>;
  /** Set the profile directly (e.g. from another API response) */
  setProfile: (profile: ProfileData | null) => void;
  /** Reset the store (e.g. on sign out) */
  reset: () => void;
}

// ═══════════════════════════════════════════
// Store
// ═══════════════════════════════════════════

export const useProfileStore = create<ProfileState & ProfileActions>((set, get) => ({
  // ─── State ───
  profile: null,
  isLoading: false,
  isInitialized: false,

  // ─── Actions ───

  fetchProfile: async () => {
    // Avoid duplicate fetches
    if (get().isLoading) return get().profile;

    set({ isLoading: true });
    try {
      const res = await fetch("/api/user/profile");
      const data = await res.json();
      if (data.success && data.data) {
        set({ profile: data.data, isInitialized: true });
        return data.data;
      }
      set({ isInitialized: true });
      return null;
    } catch {
      set({ isInitialized: true });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  updateProfile: async (updates) => {
    const currentProfile = get().profile;

    // Optimistic update — update UI immediately
    if (currentProfile) {
      set({ profile: { ...currentProfile, ...updates } });
    }

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      const data = await res.json();
      if (data.success && data.data) {
        set({ profile: data.data });
        return data.data;
      }

      // Revert on failure
      if (currentProfile) {
        set({ profile: currentProfile });
      }
      return null;
    } catch {
      // Revert on error
      if (currentProfile) {
        set({ profile: currentProfile });
      }
      return null;
    }
  },

  setProfile: (profile) => set({ profile, isInitialized: true }),

  reset: () => set({ profile: null, isLoading: false, isInitialized: false }),
}));

// ═══════════════════════════════════════════
// Convenience Hooks
// ═══════════════════════════════════════════

/** Get the target language info (with fallback) */
export function useTargetLanguage() {
  const profile = useProfileStore((s) => s.profile);
  const code = profile?.targetLanguage || "ar";
  return (
    SUPPORTED_LANGUAGES.find((l) => l.code === code) || {
      code,
      name: code,
      flagEmoji: "🌐",
      nativeName: code,
      direction: "ltr" as const,
    }
  );
}

/** Get the native language info (with fallback) */
export function useNativeLanguage() {
  const profile = useProfileStore((s) => s.profile);
  const code = profile?.nativeLanguage || "en";
  return (
    SUPPORTED_LANGUAGES.find((l) => l.code === code) || {
      code,
      name: code,
      flagEmoji: "🌐",
      nativeName: code,
      direction: "ltr" as const,
    }
  );
}
