/**
 * AuthProvider — Initializes the Zustand auth store on app mount.
 *
 * WHY STILL HAVE THIS COMPONENT?
 * - We need a place to call `initialize()` once when the app mounts
 * - It needs to be inside the React tree to detect client-side mounting
 * - It's a thin wrapper — all state lives in Zustand, not here
 *
 * The component does NOT pass any props or context to children.
 * Children access auth state via `useAuthStore()` or `useAuth()`.
 */

"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/auth-store";

// Helper to detect if we're on the client (not SSR/build)
const emptySubscribe = () => () => {};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore((s) => s.initialize);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const initializedRef = useRef(false);

  useEffect(() => {
    // Only initialize once, ever
    if (initializedRef.current) return;
    initializedRef.current = true;

    const cleanup = initialize();
    return cleanup;
  }, [initialize]);

  return <>{children}</>;
}
