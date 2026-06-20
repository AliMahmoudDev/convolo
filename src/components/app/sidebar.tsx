"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  BookOpen,
  BarChart3,
  Settings,
  LogOut,
  Flame,
  ChevronLeft,
  ChevronRight,
  User,
} from "lucide-react";
import { ConvoloLogoFull, ConvoloLogo } from "@/components/logo";
import { useAuth } from "@/components/auth/auth-provider";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Practice", href: "/learn", icon: MessageSquare },
  { label: "Vocabulary", href: "/vocabulary", icon: BookOpen },
  { label: "Progress", href: "/progress", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  // Get display name from Supabase user metadata
  const displayName = user?.user_metadata?.name || user?.email?.split("@")[0] || "User";
  const displayInitial = (user?.user_metadata?.name || user?.email || "?")[0]?.toUpperCase() || "?";

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <aside
      className={`sticky top-0 hidden h-screen flex-col border-r border-[var(--border-default)] bg-[var(--bg-surface)] transition-all duration-300 md:flex ${
        collapsed ? "w-[72px]" : "w-64"
      }`}
    >
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-[var(--border-default)] px-4">
        {collapsed ? (
          <Link href="/dashboard" className="mx-auto">
            <ConvoloLogo size="sm" />
          </Link>
        ) : (
          <ConvoloLogoFull size="sm" />
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-[var(--accent-light)] text-[var(--accent-primary)] dark:text-[var(--accent-hover)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
              } ${collapsed ? "justify-center" : ""}`}
            >
              <item.icon
                className={`h-5 w-5 shrink-0 ${isActive ? "text-[var(--accent-primary)]" : ""}`}
              />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Streak indicator */}
      <div className="mb-3 px-3">
        <div
          className={`flex items-center gap-3 rounded-xl bg-[var(--accent-light)]/50 px-3 py-3 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <Flame className="h-5 w-5 shrink-0 text-[var(--color-gold)]" />
          {!collapsed && (
            <div>
              <p className="text-xs font-semibold text-[var(--text-primary)]">0 day streak</p>
              <p className="text-[10px] text-[var(--text-muted)]">Start today!</p>
            </div>
          )}
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="mx-3 mb-2 flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-secondary)]"
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <>
            <ChevronLeft className="h-4 w-4" />
            <span>Collapse</span>
          </>
        )}
      </button>

      {/* User profile + Sign out */}
      <div className="border-t border-[var(--border-default)] px-3 pt-3 pb-4">
        {/* Profile link */}
        <Link
          href="/profile"
          className={`mb-2 flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-[var(--bg-elevated)] ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent-primary)] text-xs font-semibold text-white">
            {displayInitial}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                {displayName}
              </p>
              <p className="truncate text-[10px] text-[var(--text-muted)]">{user?.email}</p>
            </div>
          )}
        </Link>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--state-error-light)] hover:text-[var(--state-error)] ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
