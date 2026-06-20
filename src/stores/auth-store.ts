/**
 * Auth Store — Zustand-based global auth state management.
 *
 * ═══════════════════════════════════════════
 * WHY ZUSTAND INSTEAD OF REACT CONTEXT?
 * ═══════════════════════════════════════════
 *
 * React Context has several drawbacks for global auth state:
 *
 * 1. RE-RENDERS: When Context value changes, ALL consumers re-render —
 *    even if they only use `isLoading` and not `user`. Zustand uses
 *    selectors, so each component only re-renders when its specific
 *    slice of state changes.
 *
 *    Example: A component that only checks `isLoading` won't re-render
 *    when the user object changes with Zustand. With Context, it would.
 *
 * 2. PROVIDER NESTING: Context requires a Provider wrapper in the tree.
 *    If you forget it, you get silent defaults. Zustand works without
 *    any Provider — it's a standalone store that lives outside React.
 *
 * 3. BOILERPLATE: Context requires: createContext → Provider → useContext hook.
 *    Zustand: one `create()` call + direct imports.
 *
 * 4. TESTING: Zustand stores are easy to test in isolation (just call the
 *    store functions). Context requires wrapping in a Provider for tests.
 *
 * 5. PERSISTENCE: Zustand has a built-in persist middleware if we ever
 *    want to cache auth state in localStorage. Context can't do that.
 *
 * ═══════════════════════════════════════════
 * HOW IT WORKS UNDER THE HOOD
 * ═══════════════════════════════════════════
 *
 * Zustand creates a store — a plain JavaScript object with:
 *   - State: { user, isLoading, isInitialized }
 *   - Actions: { setUser, setLoading, signOut, initialize }
 *
 * When you call `useAuthStore(state => state.user)`, Zustand:
 *   1. Subscribes to the store
 *   2. Only re-renders your component when `user` actually changes
 *   3. Doesn't re-render if `isLoading` changes (because you didn't select it)
 *
 * This is called "selector-based subscriptions" and it's the #1 reason
 * Zustand is faster than Context for frequently-changing state.
 */

import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

// ═══════════════════════════════════════════
// Types
// ═══════════════════════════════════════════

interface AuthState {
  /** The current logged-in Supabase user, or null if not logged in */
  user: User | null;
  /** Whether we're still checking the auth state (first load) */
  isLoading: boolean;
  /** Whether the store has been initialized (Supabase listener attached) */
  isInitialized: boolean;
}

interface AuthActions {
  /** Set the user directly */
  setUser: (user: User | null) => void;
  /** Set loading state */
  setLoading: (loading: boolean) => void;
  /** Sign out the current user from Supabase */
  signOut: () => Promise<void>;
  /**
   * Initialize the auth store — call once on app mount.
   * This fetches the current user and subscribes to auth state changes.
   */
  initialize: () => () => void;
}

// ═══════════════════════════════════════════
// Store
// ═══════════════════════════════════════════

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  // ─── State ───
  user: null,
  isLoading: true,
  isInitialized: false,

  // ─── Actions ───
  setUser: (user) => set({ user }),

  setLoading: (isLoading) => set({ isLoading }),

  signOut: async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    set({ user: null });
  },

  initialize: () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    // If env vars are missing (build-time / CI), stop loading immediately
    if (!supabaseUrl || !supabaseAnonKey) {
      set({ isLoading: false, isInitialized: true });
      return () => {};
    }

    const supabase = createClient();

    // Get initial session
    supabase.auth.getUser().then(({ data: { user } }) => {
      set({ user, isLoading: false, isInitialized: true });
    });

    // Listen for auth changes (login, logout, token refresh)
    // This keeps the store in sync with Supabase's internal state
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      set({ user: session?.user ?? null, isLoading: false, isInitialized: true });
    });

    // Return cleanup function
    return () => subscription.unsubscribe();
  },
}));

// ═══════════════════════════════════════════
// Convenience Hooks
// ═══════════════════════════════════════════

/**
 * useAuth() — Convenience hook that returns the full auth state + actions.
 *
 * Usage:
 * ```tsx
 * const { user, isLoading, signOut } = useAuth();
 * ```
 *
 * NOTE: This selects ALL state, so the component re-renders on any change.
 * For performance-critical components, use specific selectors:
 * ```tsx
 * const user = useAuthStore(s => s.user);         // only re-renders when user changes
 * const isLoading = useAuthStore(s => s.isLoading); // only re-renders when isLoading changes
 * ```
 */
export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const signOut = useAuthStore((s) => s.signOut);
  return { user, isLoading, signOut };
}

/**
 * Derived helpers — these compute values from the store without
 * causing extra re-renders.
 */

/** Get the user's display name */
export function useUserDisplayName(): string {
  const user = useAuthStore((s) => s.user);
  return user?.user_metadata?.name || user?.email?.split("@")[0] || "User";
}

/** Get the user's initial letter (for avatars) */
export function useUserInitial(): string {
  const user = useAuthStore((s) => s.user);
  return (user?.user_metadata?.name || user?.email || "?")[0]?.toUpperCase() || "?";
}
