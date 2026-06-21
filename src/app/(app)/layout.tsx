"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/app/sidebar";
import { MobileNav } from "@/components/app/mobile-nav";
import { MobileHeader } from "@/components/app/mobile-header";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // When in a conversation, the page uses fixed inset-0 (fullscreen)
  // so we don't need the bottom padding or the mobile nav
  const isInConversation = pathname.match(/^\/learn\/[a-f0-9-]+$/);

  return (
    <div className="flex min-h-screen bg-[var(--bg-base)]">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <MobileHeader />
        <main className={`flex-1 ${isInConversation ? "" : "pb-20 md:pb-0"}`}>{children}</main>
      </div>
      <MobileNav />
    </div>
  );
}
