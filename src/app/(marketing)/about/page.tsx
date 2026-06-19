import type { Metadata } from "next";
import { FadeInSection } from "@/components/marketing/fade-in-section";
import { Globe, Heart, Lightbulb, Users, Sparkles, Target } from "lucide-react";

export const metadata: Metadata = {
  title: "About — Convolo",
  description:
    "Learn about Convolo's mission to make language learning accessible through real AI conversations.",
};

const values = [
  {
    icon: Heart,
    title: "Learner-First",
    description:
      "Every decision we make starts with one question: does this help learners become more fluent? We obsess over the learning experience, not vanity metrics. When our users succeed, we succeed.",
  },
  {
    icon: Lightbulb,
    title: "Innovation with Purpose",
    description:
      "We leverage cutting-edge AI not for novelty, but because it genuinely transforms how people learn languages. Every feature ships with a clear learning outcome — technology serves the learner, not the other way around.",
  },
  {
    icon: Globe,
    title: "Language Without Borders",
    description:
      "We believe everyone deserves access to quality language education regardless of their native language. Our flexible language pair system ensures Arabic, Spanish, French, and English speakers can learn from each other freely.",
  },
  {
    icon: Users,
    title: "Community-Driven Growth",
    description:
      "Our roadmap is shaped by learner feedback. We listen actively, iterate quickly, and build what our community needs most. From language requests to feature suggestions, our users are co-creators of Convolo.",
  },
  {
    icon: Target,
    title: "Practical Fluency",
    description:
      "We measure success not by completion rates or badges, but by whether learners can hold real conversations in their target language. Fluency is our north star, and every feature aligns with that goal.",
  },
  {
    icon: Sparkles,
    title: "Joy in Learning",
    description:
      "Language learning should feel exciting, not like a chore. We design experiences that make learners want to come back — through gamification, achievements, and the genuine satisfaction of improving.",
  },
];

export default function AboutPage() {
  return (
    <div className="bg-[var(--bg-base)] py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <FadeInSection className="mb-20 text-center">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--accent-primary)]/30 bg-[var(--accent-light)]/50 px-4 py-1.5 text-xs font-medium text-[var(--accent-primary)] backdrop-blur-sm dark:text-[var(--accent-hover)]">
            <Globe className="h-3.5 w-3.5" />
            Our Story
          </span>
          <h1
            className="mb-6 text-3xl font-bold text-[var(--text-primary)] sm:text-4xl md:text-5xl"
            style={{ fontFamily: "var(--font-heading-cfg)" }}
          >
            Making Fluency <span className="gradient-conbolo-text">Accessible to Everyone</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-[var(--text-secondary)]">
            Convolo was born from a simple observation: traditional language apps teach you to
            recognize words, but not to use them. We built a platform where learners practice real
            conversations and build the confidence to speak fluently.
          </p>
        </FadeInSection>

        {/* Mission Section */}
        <FadeInSection className="mb-20">
          <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-8 sm:p-12">
            <h2
              className="mb-6 text-2xl font-bold text-[var(--text-primary)] sm:text-3xl"
              style={{ fontFamily: "var(--font-heading-cfg)" }}
            >
              Our Mission
            </h2>
            <p className="mb-4 leading-relaxed text-[var(--text-secondary)]">
              Over 1.5 billion people worldwide are learning a foreign language, yet the vast
              majority never achieve conversational fluency. Traditional methods — flashcards,
              translation exercises, multiple choice quizzes — build recognition, not production.
              They teach you to identify the correct answer, but not to generate one spontaneously
              in a real conversation.
            </p>
            <p className="mb-4 leading-relaxed text-[var(--text-secondary)]">
              Convolo exists to close that gap. Our AI-powered conversation platform gives learners
              a safe, judgment-free space to practice speaking, receive instant corrections, and
              build the muscle memory needed for real-world communication. We believe that fluency
              comes from practice, not memorization — and that everyone deserves access to that
              practice, regardless of their budget or background.
            </p>
            <p className="leading-relaxed text-[var(--text-secondary)]">
              That is why we offer a generous free tier and keep our Pro subscription affordable.
              Language learning should not be a luxury, and conversation practice should not require
              expensive tutors or language exchange partners in distant time zones. Convolo puts a
              patient, adaptive AI tutor in your pocket — available 24/7, in any language pair we
              support.
            </p>
          </div>
        </FadeInSection>

        {/* Values */}
        <FadeInSection className="mb-20">
          <h2
            className="mb-4 text-center text-2xl font-bold text-[var(--text-primary)] sm:text-3xl"
            style={{ fontFamily: "var(--font-heading-cfg)" }}
          >
            What We <span className="gradient-conbolo-text">Stand For</span>
          </h2>
          <p className="mx-auto mb-12 max-w-xl text-center text-lg text-[var(--text-secondary)]">
            Our values shape every product decision, every feature, and every conversation on the
            platform.
          </p>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {values.map((value, i) => (
              <FadeInSection key={value.title} delay={i * 0.1}>
                <div className="h-full rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 transition-all duration-300 hover:border-[var(--accent-primary)]/30 hover:shadow-[var(--shadow-md)]">
                  <div className="gradient-conbolo mb-5 flex h-12 w-12 items-center justify-center rounded-xl">
                    <value.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3
                    className="mb-3 text-lg font-semibold text-[var(--text-primary)]"
                    style={{ fontFamily: "var(--font-heading-cfg)" }}
                  >
                    {value.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                    {value.description}
                  </p>
                </div>
              </FadeInSection>
            ))}
          </div>
        </FadeInSection>

        {/* Team */}
        <FadeInSection>
          <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-8 text-center sm:p-12">
            <h2
              className="mb-6 text-2xl font-bold text-[var(--text-primary)] sm:text-3xl"
              style={{ fontFamily: "var(--font-heading-cfg)" }}
            >
              Built by Language Learners,{" "}
              <span className="gradient-conbolo-text">for Language Learners</span>
            </h2>
            <p className="mx-auto mb-6 max-w-2xl leading-relaxed text-[var(--text-secondary)]">
              Convolo is a small, passionate team of developers, linguists, and AI researchers who
              have experienced the frustration of traditional language learning firsthand. We have
              spent years studying foreign languages through apps, classrooms, and immersion — and
              we know what works and what does not. Our shared experience drives every line of code
              and every AI prompt we write.
            </p>
            <p className="mx-auto max-w-2xl leading-relaxed text-[var(--text-secondary)]">
              We are always looking for talented people who share our mission. If you believe that
              conversation is the key to fluency and want to help us build the future of language
              learning,{" "}
              <a
                href="/careers"
                className="font-medium text-[var(--accent-primary)] transition-colors hover:text-[var(--accent-hover)]"
              >
                check out our open positions
              </a>
              .
            </p>
          </div>
        </FadeInSection>
      </div>
    </div>
  );
}
