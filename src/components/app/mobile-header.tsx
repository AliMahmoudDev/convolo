"use client";

import Link from "next/link";
import { ConvoloLogoFull } from "@/components/logo";
import { Menu, X, LogOut } from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function MobileHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-[var(--border-default)] bg-[var(--bg-surface)] px-4 md:hidden">
      <ConvoloLogoFull size="sm" />

      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        aria-label="Toggle menu"
      >
        {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {menuOpen && (
        <div className="absolute top-14 right-0 left-0 space-y-2 border-b border-[var(--border-default)] bg-[var(--bg-surface)] p-4">
          <Link
            href="/dashboard"
            onClick={() => setMenuOpen(false)}
            className="block py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            Dashboard
          </Link>
          <Link
            href="/learn"
            onClick={() => setMenuOpen(false)}
            className="block py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            Practice
          </Link>
          <Link
            href="/vocabulary"
            onClick={() => setMenuOpen(false)}
            className="block py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            Vocabulary
          </Link>
          <Link
            href="/progress"
            onClick={() => setMenuOpen(false)}
            className="block py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            Progress
          </Link>
          <Link
            href="/settings"
            onClick={() => setMenuOpen(false)}
            className="block py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            Settings
          </Link>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 py-2 text-sm text-[var(--state-error)] hover:text-[var(--state-error)]"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      )}
    </header>
  );
}
