/**
 * Marketing Navbar — shown on public pages (/, /features, /pricing, etc.)
 *
 * BEHAVIOR:
 * - If NOT logged in: shows "Log In" + "Sign Up Free" buttons
 * - If logged in: shows user avatar + name dropdown with:
 *   → Dashboard (go to app)
 *   → Profile (go to /profile)
 *   → Sign Out (opens confirmation dialog OUTSIDE the dropdown)
 *
 * IMPORTANT: The ConfirmSignOutDialog is rendered OUTSIDE the dropdown menu.
 * If it were inside, clicking "Sign Out" would close the dropdown, which
 * unmounts the dialog instantly. By keeping it outside, the dialog survives.
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, XIcon, ChevronDown, LayoutDashboard, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConvoloLogoFull } from "@/components/logo";
import { ThemeToggle } from "@/components/marketing/theme-toggle";
import { useAuthStore, useUserDisplayName, useUserInitial } from "@/stores/auth-store";
import { ConfirmSignOutDialog } from "@/components/auth/confirm-sign-out";

const navLinks = [
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
  { label: "FAQ", href: "/faq" },
];

function UserAvatar({ initial }: { initial: string }) {
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent-primary)] text-xs font-semibold text-white">
      {initial}
    </div>
  );
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [signOutDialogOpen, setSignOutDialogOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const signOut = useAuthStore((s) => s.signOut);
  const displayName = useUserDisplayName();
  const displayInitial = useUserInitial();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOutClick = () => {
    // Close menus first, then open the dialog
    setProfileDropdownOpen(false);
    setMobileMenuOpen(false);
    setSignOutDialogOpen(true);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <>
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`fixed top-0 right-0 left-0 z-50 transition-all duration-300 ${
          scrolled
            ? "border-b border-[var(--border-default)] bg-[var(--bg-base)]/80 shadow-[var(--shadow-sm)] backdrop-blur-xl"
            : "bg-transparent"
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between sm:h-18">
            <Link href="/" className="flex items-center">
              <ConvoloLogoFull size="default" />
            </Link>

            <div className="hidden items-center gap-8 md:flex">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="hidden items-center gap-3 md:flex">
              <ThemeToggle />

              {isLoading ? (
                <div className="h-8 w-20 animate-pulse rounded-lg bg-[var(--bg-elevated)]" />
              ) : user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-[var(--bg-elevated)]"
                  >
                    <UserAvatar initial={displayInitial} />
                    <span className="max-w-[120px] truncate text-sm font-medium text-[var(--text-primary)]">
                      {displayName}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-[var(--text-muted)] transition-transform ${
                        profileDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {profileDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[var(--shadow-lg)]"
                      >
                        <div className="border-b border-[var(--border-default)] px-4 py-3">
                          <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                            {displayName}
                          </p>
                          <p className="truncate text-xs text-[var(--text-muted)]">{user.email}</p>
                        </div>

                        <div className="py-1">
                          <Link
                            href="/dashboard"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                          >
                            <LayoutDashboard className="h-4 w-4" />
                            Dashboard
                          </Link>
                          <Link
                            href="/profile"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                          >
                            <User className="h-4 w-4" />
                            Profile
                          </Link>
                        </div>

                        {/* Sign out button — just triggers dialog, dialog is OUTSIDE */}
                        <div className="border-t border-[var(--border-default)] py-1">
                          <button
                            onClick={handleSignOutClick}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-[var(--state-error)] transition-colors hover:bg-[var(--state-error-light)]"
                          >
                            <LogOut className="h-4 w-4" />
                            Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <>
                  <Link href="/login">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    >
                      Log In
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button
                      size="sm"
                      className="gradient-conbolo rounded-lg border-0 px-5 text-white transition-opacity hover:opacity-90"
                    >
                      Sign Up Free
                    </Button>
                  </Link>
                </>
              )}
            </div>

            <div className="flex items-center gap-2 md:hidden">
              <ThemeToggle />
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <XIcon className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="border-t border-[var(--border-default)] bg-[var(--bg-base)]/95 backdrop-blur-xl md:hidden"
            >
              <div className="space-y-3 px-4 py-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
                  >
                    {link.label}
                  </Link>
                ))}

                {isLoading ? (
                  <div className="h-8 animate-pulse rounded-lg bg-[var(--bg-elevated)]" />
                ) : user ? (
                  <div className="border-t border-[var(--border-default)] pt-3">
                    <div className="mb-3 flex items-center gap-3">
                      <UserAvatar initial={displayInitial} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                          {displayName}
                        </p>
                        <p className="truncate text-xs text-[var(--text-muted)]">{user.email}</p>
                      </div>
                    </div>
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </Link>
                    <Link
                      href="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    >
                      <User className="h-4 w-4" />
                      Profile
                    </Link>
                    {/* Sign out — just triggers dialog, dialog is OUTSIDE */}
                    <button
                      onClick={handleSignOutClick}
                      className="flex w-full items-center gap-2 py-2 text-sm text-[var(--state-error)]"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 border-t border-[var(--border-default)] pt-3">
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-center text-[var(--text-secondary)]"
                      >
                        Log In
                      </Button>
                    </Link>
                    <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                      <Button
                        size="sm"
                        className="gradient-conbolo w-full rounded-lg border-0 text-white transition-opacity hover:opacity-90"
                      >
                        Sign Up Free
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Sign-out confirmation dialog — OUTSIDE the dropdown so it doesn't get unmounted */}
      <ConfirmSignOutDialog
        onConfirm={handleSignOut}
        open={signOutDialogOpen}
        onOpenChange={setSignOutDialogOpen}
      />
    </>
  );
}
