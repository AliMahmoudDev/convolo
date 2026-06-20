"use client";

import Link from "next/link";
import { ConvoloLogoFull } from "@/components/logo";
import { Menu, X, LogOut, User, LayoutDashboard } from "lucide-react";
import { useState } from "react";
import { useAuthStore, useUserDisplayName, useUserInitial } from "@/stores/auth-store";
import { ConfirmSignOutDialog } from "@/components/auth/confirm-sign-out";
import { useRouter } from "next/navigation";

export function MobileHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  // Zustand selectors
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const displayName = useUserDisplayName();
  const displayInitial = useUserInitial();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-[var(--border-default)] bg-[var(--bg-surface)] px-4 md:hidden">
      {/* Logo — links to landing page */}
      <Link href="/">
        <ConvoloLogoFull size="sm" />
      </Link>

      <div className="flex items-center gap-2">
        {/* User avatar (quick link to profile) */}
        <Link
          href="/profile"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent-primary)] text-xs font-semibold text-white"
        >
          {displayInitial}
        </Link>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {menuOpen && (
        <div className="absolute top-14 right-0 left-0 space-y-2 border-b border-[var(--border-default)] bg-[var(--bg-surface)] p-4">
          {/* User info */}
          <div className="mb-2 flex items-center gap-3 rounded-xl bg-[var(--bg-elevated)] px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent-primary)] text-xs font-semibold text-white">
              {displayInitial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                {displayName}
              </p>
              <p className="truncate text-xs text-[var(--text-muted)]">{user?.email}</p>
            </div>
          </div>

          <Link
            href="/dashboard"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
          <Link
            href="/learn"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            Practice
          </Link>
          <Link
            href="/vocabulary"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            Vocabulary
          </Link>
          <Link
            href="/progress"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            Progress
          </Link>
          <Link
            href="/profile"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <User className="h-4 w-4" />
            Profile
          </Link>
          <Link
            href="/settings"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            Settings
          </Link>
          {/* Sign out with confirmation */}
          <ConfirmSignOutDialog onConfirm={handleSignOut}>
            <button
              onClick={() => setMenuOpen(false)}
              className="flex w-full items-center gap-2 py-2 text-sm text-[var(--state-error)]"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </ConfirmSignOutDialog>
        </div>
      )}
    </header>
  );
}
