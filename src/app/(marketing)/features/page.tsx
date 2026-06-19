import type { Metadata } from "next";
import Link from "next/link";
import { FadeInSection } from "@/components/marketing/fade-in-section";
import {
  MessageSquare,
  SpellCheck,
  Globe,
  BarChart3,
  BookOpen,
  Brain,
  ArrowRight,
  Shield,
  Sparkles,
  Zap,
  Users,
  Languages,
  Headphones,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Features — Convolo",
  description:
    "Discover the powerful features that make Convolo the most effective AI-powered language learning platform.",
};

const mainFeatures = [
  {
    icon: MessageSquare,
    title: "AI Conversations",
    description:
      "Practice real dialogues with an intelligent AI tutor that responds naturally, maintains context throughout the conversation, and keeps the dialogue flowing. Unlike scripted chatbots, our AI generates unique, contextually appropriate responses every time — creating truly dynamic conversation practice that adapts to what you say and how you say it.",
    highlights: [
      "Natural, unscripted dialogue that responds to your input",
      "Context-aware conversations that build on previous exchanges",
      "Multiple scenario types from casual to professional",
    ],
  },
  {
    icon: SpellCheck,
    title: "Instant Corrections",
    description:
      "Receive real-time grammar, vocabulary, and phrasing corrections — explained in context, not just marked wrong. Each correction includes a clear explanation of why the change is needed, helping you understand the rule rather than simply memorizing the right answer. This approach accelerates learning by turning every mistake into a teachable moment.",
    highlights: [
      "Contextual explanations, not just error flags",
      "Grammar, vocabulary, and phrasing corrections",
      "Native-language explanations for better understanding",
    ],
  },
  {
    icon: Globe,
    title: "Real-World Scenarios",
    description:
      "From ordering coffee to business meetings — practice the situations you will actually face. Our scenario library covers everyday conversations, travel situations, professional settings, and social interactions. Each scenario is designed to teach practical language skills that you can immediately apply in real life, making your practice time directly relevant to your goals.",
    highlights: [
      "Everyday conversations and travel scenarios",
      "Professional and business meeting practice",
      "Custom difficulty levels for each scenario",
    ],
  },
  {
    icon: BarChart3,
    title: "Track Your Progress",
    description:
      "Watch your fluency grow with detailed analytics, streaks, and achievements that keep you motivated. Our progress dashboard shows your conversation count, correction trends, vocabulary growth, and fluency score over time. Streaks and achievements provide positive reinforcement, making daily practice feel rewarding rather than obligatory.",
    highlights: [
      "Fluency score tracking over time",
      "Streak system for daily motivation",
      "Achievement badges for milestones",
    ],
  },
  {
    icon: BookOpen,
    title: "Smart Vocabulary Book",
    description:
      "Words you encounter in conversation are automatically saved with spaced repetition scheduling to make them stick forever. The vocabulary book organizes words by frequency, topic, and mastery level, while our SRS algorithm determines the optimal time for review based on your individual forgetting curve. No more manually adding flashcards — your learning happens organically through conversation.",
    highlights: [
      "Automatic word saving from conversations",
      "Spaced repetition for optimal retention",
      "Organized by topic, frequency, and mastery",
    ],
  },
  {
    icon: Brain,
    title: "Adaptive Difficulty",
    description:
      "The AI adjusts to your level in real-time — challenging enough to grow, easy enough to keep going. As your skills improve, the conversation complexity increases naturally, introducing more sophisticated vocabulary, complex grammar structures, and faster-paced dialogue. If you struggle with a concept, the AI provides gentler practice before ramping up again, ensuring you are always in the optimal learning zone.",
    highlights: [
      "Real-time adjustment based on your performance",
      "Gradual complexity increase as skills grow",
      "Automatic scaffolding when you struggle",
    ],
  },
];

const additionalFeatures = [
  {
    icon: Languages,
    title: "Flexible Language Pairs",
    description:
      "Learn any language from any language. Arabic speakers can learn French, Spanish speakers can learn English — no English required as a bridge.",
  },
  {
    icon: Shield,
    title: "Private & Secure",
    description:
      "End-to-end encrypted conversations that are never shared. Delete your data anytime. Your learning journey is yours alone.",
  },
  {
    icon: Zap,
    title: "Fast AI Responses",
    description:
      "Powered by Google Gemini for natural, responsive conversations with minimal latency, even during complex dialogue exchanges.",
  },
  {
    icon: Users,
    title: "10,000+ Learners",
    description:
      "Join a growing community of language learners who are building fluency through real conversation practice with AI.",
  },
  {
    icon: Headphones,
    title: "Multiple Scenarios",
    description:
      "Practice in contexts that matter to you: casual chat, travel, business, healthcare, dining, and more scenarios added regularly.",
  },
  {
    icon: Sparkles,
    title: "Free to Start",
    description:
      "Begin your language journey with 3 daily conversations at no cost. Upgrade to Pro for unlimited practice when you are ready.",
  },
];

export default function FeaturesPage() {
  return (
    <div className="bg-[var(--bg-base)] py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <FadeInSection className="mb-20 text-center">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--accent-primary)]/30 bg-[var(--accent-light)]/50 px-4 py-1.5 text-xs font-medium text-[var(--accent-primary)] backdrop-blur-sm dark:text-[var(--accent-hover)]">
            <Sparkles className="h-3.5 w-3.5" />
            Powerful Features
          </span>
          <h1
            className="mb-6 text-3xl font-bold text-[var(--text-primary)] sm:text-4xl md:text-5xl"
            style={{ fontFamily: "var(--font-heading-cfg)" }}
          >
            Everything You Need to <span className="gradient-conbolo-text">Speak Fluently</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-[var(--text-secondary)]">
            Powerful features designed to make language learning feel natural, effective, and
            actually enjoyable. Built by learners, for learners.
          </p>
        </FadeInSection>

        {/* Main Features - Detailed */}
        <div className="mb-24 space-y-16">
          {mainFeatures.map((feature, i) => (
            <FadeInSection key={feature.title} delay={0.1}>
              <div
                className={`flex flex-col ${
                  i % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"
                } items-start gap-8 lg:gap-12`}
              >
                {/* Text Content */}
                <div className="flex-1">
                  <div className="gradient-conbolo mb-5 flex h-12 w-12 items-center justify-center rounded-xl">
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h2
                    className="mb-4 text-2xl font-bold text-[var(--text-primary)] sm:text-3xl"
                    style={{ fontFamily: "var(--font-heading-cfg)" }}
                  >
                    {feature.title}
                  </h2>
                  <p className="mb-6 leading-relaxed text-[var(--text-secondary)]">
                    {feature.description}
                  </p>
                  <ul className="space-y-3">
                    {feature.highlights.map((highlight) => (
                      <li
                        key={highlight}
                        className="flex items-start gap-3 text-sm text-[var(--text-secondary)]"
                      >
                        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent-light)]">
                          <div className="h-1.5 w-1.5 rounded-full bg-[var(--accent-primary)]" />
                        </div>
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Visual Card */}
                <div className="w-full flex-1">
                  <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-8">
                    <div className="flex aspect-video items-center justify-center rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)]">
                      <div className="text-center">
                        <feature.icon className="mx-auto mb-3 h-16 w-16 text-[var(--accent-primary)] opacity-30" />
                        <p className="text-sm text-[var(--text-muted)]">{feature.title} Preview</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </FadeInSection>
          ))}
        </div>

        {/* Additional Features Grid */}
        <FadeInSection className="mb-20">
          <h2
            className="mb-8 text-center text-2xl font-bold text-[var(--text-primary)] sm:text-3xl"
            style={{ fontFamily: "var(--font-heading-cfg)" }}
          >
            And <span className="gradient-conbolo-text">Much More</span>
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {additionalFeatures.map((feature, i) => (
              <FadeInSection key={feature.title} delay={i * 0.1}>
                <div className="h-full rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 transition-all duration-300 hover:border-[var(--accent-primary)]/30">
                  <feature.icon className="mb-4 h-8 w-8 text-[var(--accent-primary)]" />
                  <h3
                    className="mb-2 text-lg font-semibold text-[var(--text-primary)]"
                    style={{ fontFamily: "var(--font-heading-cfg)" }}
                  >
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                    {feature.description}
                  </p>
                </div>
              </FadeInSection>
            ))}
          </div>
        </FadeInSection>

        {/* CTA */}
        <FadeInSection>
          <div className="gradient-conbolo relative overflow-hidden rounded-2xl p-8 text-center sm:p-12">
            <div className="dot-pattern absolute inset-0 opacity-10" />
            <div className="relative z-10">
              <h2
                className="mb-4 text-2xl font-bold text-white sm:text-3xl"
                style={{ fontFamily: "var(--font-heading-cfg)" }}
              >
                Ready to Experience These Features?
              </h2>
              <p className="mx-auto mb-8 max-w-lg text-white/80">
                Start your free account today and see why thousands of learners choose Convolo for
                conversation practice.
              </p>
              <Button
                size="lg"
                className="h-12 rounded-xl bg-white px-8 text-base font-bold text-[var(--accent-primary)] shadow-lg hover:bg-white/90"
              >
                Start Learning Free
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </FadeInSection>
      </div>
    </div>
  );
}
