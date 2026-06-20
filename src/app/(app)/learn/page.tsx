import type { Metadata } from "next";
import Link from "next/link";
import { MessageSquare, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Practice — Convolo",
  description: "Start a conversation with your AI language tutor.",
};

const scenarios = [
  {
    id: "1",
    title: "Ordering at a Restaurant",
    description:
      "Practice ordering food and drinks at a restaurant, asking about menu items, and handling the bill.",
    category: "Daily",
    difficulty: "Beginner",
    language: "Arabic",
    openingLine: "أهلاً وسهلاً! تفضل بالجلوس. ماذا تريد أن تطلب؟",
    premium: false,
  },
  {
    id: "2",
    title: "At the Airport",
    description: "Navigate check-in, security, and boarding at an airport in your target language.",
    category: "Travel",
    difficulty: "Beginner",
    language: "Arabic",
    openingLine: "مرحباً! يمكنني مساعدتك؟ هل أنت جاهز لتسجيل الدخول؟",
    premium: false,
  },
  {
    id: "3",
    title: "Coffee Shop Chat",
    description:
      "Casual conversation at a coffee shop with a friend. Practice everyday small talk.",
    category: "Social",
    difficulty: "Beginner",
    language: "Spanish",
    openingLine: "¡Hola! ¿Qué tal? ¿Qué te pido?",
    premium: false,
  },
  {
    id: "4",
    title: "Hotel Check-in",
    description:
      "Check into a hotel, ask about amenities, and resolve a minor issue with your room.",
    category: "Travel",
    difficulty: "Beginner",
    language: "French",
    openingLine: "Bonsoir! Bienvenue à notre hôtel.",
    premium: false,
  },
  {
    id: "5",
    title: "Business Meeting",
    description: "Introduce yourself and your company in a professional business meeting.",
    category: "Business",
    difficulty: "Intermediate",
    language: "Arabic",
    openingLine: "السلام عليكم، تشرفنا بمعرفتك.",
    premium: true,
  },
  {
    id: "6",
    title: "Doctor Visit",
    description: "Describe your symptoms to a doctor and understand medical instructions.",
    category: "Medical",
    difficulty: "Intermediate",
    language: "Arabic",
    openingLine: "مرحباً، ما الذي يجلبك اليوم؟",
    premium: true,
  },
];

export default function LearnPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-8">
        <h1
          className="mb-2 text-2xl font-bold text-[var(--text-primary)] sm:text-3xl"
          style={{ fontFamily: "var(--font-heading-cfg)" }}
        >
          Practice Conversations
        </h1>
        <p className="text-[var(--text-secondary)]">
          Choose a scenario or start a free chat with your AI tutor
        </p>
      </div>

      {/* Free Chat CTA */}
      <div className="gradient-conbolo relative mb-8 overflow-hidden rounded-2xl p-6 text-white">
        <div className="dot-pattern absolute inset-0 opacity-10" />
        <div className="relative z-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              <h2
                className="text-lg font-semibold"
                style={{ fontFamily: "var(--font-heading-cfg)" }}
              >
                Free Chat
              </h2>
            </div>
            <p className="text-sm text-white/70">
              Talk about anything with your AI tutor. No script, just natural conversation.
            </p>
          </div>
          <Button className="h-11 shrink-0 rounded-xl bg-white px-6 text-sm font-semibold text-[var(--accent-primary)] hover:bg-white/90">
            <MessageSquare className="mr-1.5 h-4 w-4" />
            Start Free Chat
          </Button>
        </div>
      </div>

      {/* Scenario Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {scenarios.map((scenario) => (
          <div
            key={scenario.id}
            className="group rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--accent-primary)]/30 hover:shadow-[var(--shadow-md)]"
          >
            <div className="mb-3 flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-[var(--accent-light)] px-2.5 py-0.5 text-[10px] font-medium text-[var(--accent-primary)]">
                {scenario.category}
              </span>
              <span className="inline-flex items-center rounded-full bg-[var(--bg-elevated)] px-2.5 py-0.5 text-[10px] font-medium text-[var(--text-secondary)]">
                {scenario.difficulty}
              </span>
            </div>
            <h3
              className="mb-2 text-base font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-heading-cfg)" }}
            >
              {scenario.title}
            </h3>
            <p className="mb-4 text-xs leading-relaxed text-[var(--text-secondary)]">
              {scenario.description}
            </p>
            <div className="mb-3 text-xs text-[var(--text-muted)] italic">
              &ldquo;{scenario.openingLine}&rdquo;
            </div>
            <Button
              size="sm"
              className={`h-9 w-full rounded-lg text-xs ${
                scenario.premium
                  ? "border border-[var(--accent-primary)]/30 bg-transparent text-[var(--accent-primary)] hover:bg-[var(--accent-light)]"
                  : "gradient-conbolo border-0 text-white hover:opacity-90"
              }`}
            >
              {scenario.premium ? "Upgrade to Pro" : "Start Conversation"}
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
