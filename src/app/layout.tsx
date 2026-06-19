import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-heading-cfg",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono-cfg",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Convolo — Conversation, Unlocked.",
  description:
    "Master any language through real conversations with AI. Practice speaking, get instant corrections, and build fluency naturally with Convolo.",
  keywords: [
    "Convolo",
    "language learning",
    "AI tutor",
    "conversation practice",
    "fluency",
    "language app",
  ],
  authors: [{ name: "Convolo" }],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Convolo — Conversation, Unlocked.",
    description:
      "Master any language through real conversations with AI. Practice speaking, get instant corrections, and build fluency naturally.",
    url: "https://convolo.vercel.app",
    siteName: "Convolo",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Convolo — Conversation, Unlocked.",
    description:
      "Master any language through real conversations with AI. Practice speaking, get instant corrections, and build fluency naturally.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${plusJakartaSans.variable} ${inter.variable} ${jetbrainsMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
