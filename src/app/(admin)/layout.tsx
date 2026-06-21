"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  ArrowLeft,
  Shield,
  LogOut,
} from "lucide-react";
import { useAuthStore, useUserDisplayName, useUserInitial } from "@/stores/auth-store";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Scenarios", href: "/admin/scenarios", icon: BookOpen },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const signOut = useAuthStore((s) => s.signOut);
  const user = useAuthStore((s) => s.user);
  const displayName = useUserDisplayName();
  const displayInitial = useUserInitial();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
    router.refresh();
  };

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-[var(--bg-base)]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-[var(--border-default)] bg-[var(--bg-surface)] transition-transform duration-300 lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-[var(--border-default)] px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--accent-primary)] text-white">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-[var(--text-primary)]">Convolo Admin</h1>
            <p className="text-[10px] text-[var(--text-muted)]">Management Dashboard</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-[var(--accent-light)] text-[var(--accent-primary)] dark:text-[var(--accent-hover)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                )}
              >
                <item.icon
                  className={cn("h-5 w-5 shrink-0", active && "text-[var(--accent-primary)]")}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Back to app */}
        <div className="border-t border-[var(--border-default)] px-3 pt-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
          >
            <ArrowLeft className="h-5 w-5 shrink-0" />
            <span>Back to App</span>
          </Link>
        </div>

        {/* User profile */}
        <div className="border-t border-[var(--border-default)] px-3 py-3">
          <div className="mb-2 flex items-center gap-3 rounded-xl px-3 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent-primary)] text-xs font-semibold text-white">
              {displayInitial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                {displayName}
              </p>
              <p className="truncate text-[10px] text-[var(--text-muted)]">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--state-error-light)] hover:text-[var(--state-error)]"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-[var(--border-default)] bg-[var(--bg-surface)]/80 px-4 backdrop-blur-md lg:px-8">
          {/* Mobile menu toggle */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] lg:hidden"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-[var(--text-muted)] sm:inline">
              {user?.email}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent-primary)] text-xs font-semibold text-white">
              {displayInitial}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-x-hidden p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
