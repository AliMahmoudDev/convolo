/**
 * AuthProvider — Exposes the current Supabase user via React Context.
 *
 * WHY DO WE NEED THIS?
 * Before this change, AuthProvider only managed internal state — it fetched
 * the user from Supabase but didn't share it with any child components.
 * This meant EVERY component that needed the user had to independently call
 * supabase.auth.getUser(), which is:
 *   - Wasteful (multiple identical API calls)
 *   - Slow (each component waits for its own fetch)
 *   - Inconsistent (different components might get different states)
 *
 * NOW: AuthProvider puts the user in a React Context. Any component can call
 * `useAuth()` to get { user, isLoading, signOut } without making its own
 * Supabase call. One fetch, shared everywhere.
 *
 * HOW IT WORKS:
 * 1. On mount, calls supabase.auth.getUser() to get the current session
 * 2. Subscribes to onAuthStateChange for real-time updates (login/logout)
 * 3. Stores user in state + shares via Context
 * 4. Provides signOut() helper for convenience
 */

"use client";

import { createClient } from "@/lib/supabase/client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useSyncExternalStore,
} from "react";
import type { User } from "@supabase/supabase-js";

// ═══════════════════════════════════════════
// Context Type
// ═══════════════════════════════════════════

interface AuthContextType {
  /** The current logged-in Supabase user, or null if not logged in */
  user: User | null;
  /** Whether we're still checking the auth state (first load) */
  isLoading: boolean;
  /** Sign out the current user */
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  signOut: async () => {},
});

// ═══════════════════════════════════════════
// Hook
// ═══════════════════════════════════════════

/**
 * useAuth() — Access the current user from any component.
 *
 * Usage:
 * ```tsx
 * const { user, isLoading, signOut } = useAuth();
 * if (isLoading) return <Spinner />;
 * if (user) return <p>Hello {user.email}</p>;
 * return <LoginButton />;
 * ```
 */
export function useAuth(): AuthContextType {
  return useContext(AuthContext);
}

// ═══════════════════════════════════════════
// Provider Component
// ═══════════════════════════════════════════

const emptySubscribe = () => () => {};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey || !mounted) {
      // Use a microtask to avoid the "set-state-in-effect" lint rule
      // This is a valid pattern — we need to stop loading when env vars are missing
      const id = requestAnimationFrame(() => setIsLoading(false));
      return () => cancelAnimationFrame(id);
    }

    const supabase = createClient();

    // Get initial session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setIsLoading(false);
    });

    // Listen for auth changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [mounted]);

  // Sign out helper
  const signOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, signOut }}>{children}</AuthContext.Provider>
  );
}
