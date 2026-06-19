import { MessageSquare, SpellCheck, Globe, BarChart3, BookOpen, Brain } from "lucide-react";
import { FadeInSection } from "@/components/marketing/fade-in-section";

const features = [
  {
    icon: MessageSquare,
    title: "AI Conversations",
    description:
      "Practice real dialogues with an intelligent AI tutor that responds naturally and keeps the conversation flowing.",
  },
  {
    icon: SpellCheck,
    title: "Instant Corrections",
    description:
      "Get real-time grammar, vocabulary, and phrasing corrections — explained in context, not just marked wrong.",
  },
  {
    icon: Globe,
    title: "Real-World Scenarios",
    description:
      "From ordering coffee to business meetings — practice the situations you'll actually face.",
  },
  {
    icon: BarChart3,
    title: "Track Your Progress",
    description:
      "Watch your fluency grow with detailed analytics, streaks, and achievements that keep you motivated.",
  },
  {
    icon: BookOpen,
    title: "Smart Vocabulary Book",
    description:
      "Words you encounter are automatically saved with spaced repetition to make them stick forever.",
  },
  {
    icon: Brain,
    title: "Adaptive Difficulty",
    description:
      "The AI adjusts to your level in real-time — challenging enough to grow, easy enough to keep going.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="bg-[var(--bg-surface)] py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeInSection className="mb-16 text-center">
          <h2
            className="mb-4 text-3xl font-bold text-[var(--text-primary)] sm:text-4xl md:text-5xl"
            style={{ fontFamily: "var(--font-heading-cfg)" }}
          >
            Everything You Need to <span className="gradient-conbolo-text">Speak Fluently</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-[var(--text-secondary)]">
            Powerful features designed to make language learning feel natural, effective, and
            actually enjoyable.
          </p>
        </FadeInSection>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <FadeInSection key={feature.title} delay={i * 0.1}>
              <div className="group relative h-full rounded-2xl border border-[var(--border-default)] bg-[var(--bg-base)] p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--accent-primary)]/30 hover:shadow-[var(--shadow-md)]">
                <div className="gradient-conbolo mb-5 flex h-12 w-12 items-center justify-center rounded-xl transition-shadow duration-300 group-hover:shadow-[var(--shadow-glow)]">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3
                  className="mb-3 text-xl font-semibold text-[var(--text-primary)]"
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
      </div>
    </section>
  );
}
