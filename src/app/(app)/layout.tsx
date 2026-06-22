"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/app/sidebar";
import { MobileNav } from "@/components/app/mobile-nav";
import { MobileHeader } from "@/components/app/mobile-header";
import { useProfileStore } from "@/stores/profile-store";
import { useAuthStore } from "@/stores/auth-store";
import { SpeechProvider } from "@/hooks/use-speech";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const profile = useProfileStore((s) => s.profile);
  const isProfileInitialized = useProfileStore((s) => s.isInitialized);
  const fetchProfile = useProfileStore((s) => s.fetchProfile);
  const user = useAuthStore((s) => s.user);

  // Fetch profile on mount if not initialized and user is logged in
  useEffect(() => {
    if (!isProfileInitialized && user) {
      fetchProfile();
    }
  }, [isProfileInitialized, user, fetchProfile]);

  // Redirect to onboarding if profile loaded and onboarding not completed
  // Don't redirect if already on /onboarding
  useEffect(() => {
    if (
      isProfileInitialized &&
      profile &&
      !profile.onboardingCompleted &&
      pathname !== "/onboarding"
    ) {
      router.replace("/onboarding");
    }
  }, [isProfileInitialized, profile, pathname, router]);

  const isOnOnboarding = pathname === "/onboarding";

  // When in a conversation, the page uses fixed inset-0 (fullscreen)
  // so we don't need the bottom padding or the mobile nav
  const isInConversation = pathname.match(/^\/learn\/[a-f0-9-]+$/);

  // Onboarding page gets a full-screen layout without sidebar/nav
  if (isOnOnboarding) {
    return <>{children}</>;
  }

  return (
    <SpeechProvider>
      <div className="flex min-h-screen max-w-[100vw] overflow-x-hidden bg-[var(--bg-base)]">
        <Sidebar />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <MobileHeader />
          <main className={`flex-1 ${isInConversation ? "" : "pb-20 md:pb-0"}`}>{children}</main>
        </div>
        <MobileNav />
      </div>
    </SpeechProvider>
  );
}
