"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, MessageSquare, BookOpen, BarChart3, Settings } from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Practice", href: "/learn", icon: MessageSquare },
  { label: "Vocabulary", href: "/vocabulary", icon: BookOpen },
  { label: "Progress", href: "/progress", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();

  // Hide the bottom nav when user is in an active conversation
  // (the conversation page uses fixed inset-0 for fullscreen)
  const isInConversation = pathname.match(/^\/learn\/[a-f0-9-]+$/);

  if (isInConversation) return null;

  return (
    <nav className="safe-area-bottom fixed right-0 bottom-0 left-0 z-50 border-t border-[var(--border-default)] bg-[var(--bg-surface)] md:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-w-0 flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 transition-colors ${
                isActive
                  ? "text-[var(--accent-primary)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="truncate text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
