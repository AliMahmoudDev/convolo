"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Globe,
  Target,
  Bell,
  Shield,
  CreditCard,
  LogOut,
  Crown,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const settingsSections = [
  {
    title: "Profile",
    icon: User,
    items: [
      {
        label: "Display Name",
        value: "Set up your profile",
        type: "text" as const,
      },
      {
        label: "Email",
        value: "Sign in to view",
        type: "text" as const,
      },
    ],
  },
  {
    title: "Learning Preferences",
    icon: Globe,
    items: [
      {
        label: "Native Language",
        value: "English",
        type: "text" as const,
      },
      {
        label: "Target Language",
        value: "Not selected",
        type: "select" as const,
      },
      {
        label: "Proficiency Level",
        value: "Beginner",
        type: "select" as const,
      },
      {
        label: "Daily Goal",
        value: "15 minutes",
        type: "select" as const,
      },
    ],
  },
  {
    title: "Subscription",
    icon: CreditCard,
    items: [
      {
        label: "Current Plan",
        value: "Free",
        type: "plan" as const,
      },
    ],
  },
];

export default function SettingsPage() {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-8">
        <h1
          className="mb-2 text-2xl font-bold text-[var(--text-primary)] sm:text-3xl"
          style={{ fontFamily: "var(--font-heading-cfg)" }}
        >
          Settings
        </h1>
        <p className="text-[var(--text-secondary)]">
          Manage your profile, preferences, and subscription
        </p>
      </div>

      <div className="space-y-6">
        {settingsSections.map((section) => (
          <div
            key={section.title}
            className="overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)]"
          >
            <div className="flex items-center gap-3 border-b border-[var(--border-default)] px-6 py-4">
              <section.icon className="h-5 w-5 text-[var(--accent-primary)]" />
              <h2
                className="text-base font-semibold text-[var(--text-primary)]"
                style={{ fontFamily: "var(--font-heading-cfg)" }}
              >
                {section.title}
              </h2>
            </div>
            <div className="divide-y divide-[var(--border-default)]">
              {section.items.map((item) => (
                <div key={item.label} className="flex items-center justify-between px-6 py-4">
                  <span className="text-sm text-[var(--text-secondary)]">{item.label}</span>
                  {item.type === "plan" ? (
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-[var(--text-primary)]">
                        {item.value}
                      </span>
                      <Button
                        size="sm"
                        className="gradient-conbolo h-8 rounded-lg border-0 px-4 text-xs text-white"
                      >
                        <Crown className="mr-1 h-3.5 w-3.5" />
                        Upgrade to Pro
                      </Button>
                    </div>
                  ) : (
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                      {item.value}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Danger Zone */}
        <div className="overflow-hidden rounded-2xl border border-[var(--state-error)]/20 bg-[var(--bg-surface)]">
          <div className="flex items-center gap-3 border-b border-[var(--border-default)] px-6 py-4">
            <Shield className="h-5 w-5 text-[var(--state-error)]" />
            <h2
              className="text-base font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-heading-cfg)" }}
            >
              Account
            </h2>
          </div>
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">Sign Out</p>
              <p className="text-xs text-[var(--text-muted)]">
                Sign out of your account on this device
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="rounded-lg text-sm text-[var(--state-error)] hover:bg-[var(--state-error-light)]"
            >
              <LogOut className="mr-1.5 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
