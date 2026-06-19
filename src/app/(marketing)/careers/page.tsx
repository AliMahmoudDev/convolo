import type { Metadata } from "next";
import { FadeInSection } from "@/components/marketing/fade-in-section";
import { MapPin, Briefcase, Clock, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Careers — Convolo",
  description: "Join the Convolo team and help build the future of AI-powered language learning.",
};

const openPositions = [
  {
    title: "Senior Frontend Engineer",
    department: "Engineering",
    location: "Remote",
    type: "Full-time",
    description:
      "Build and maintain Convolo's web application using Next.js, React, and TypeScript. You will own the entire frontend experience from the marketing site to the in-app conversation interface, ensuring pixel-perfect design, smooth animations, and responsive layouts across all devices.",
  },
  {
    title: "AI/NLP Engineer",
    department: "Engineering",
    location: "Remote",
    type: "Full-time",
    description:
      "Design and optimize our AI conversation engine, prompt engineering pipelines, and response quality systems. You will work at the intersection of NLP research and product engineering, ensuring our AI tutor delivers natural, pedagogically sound conversations across all supported language pairs.",
  },
  {
    title: "Product Designer",
    department: "Design",
    location: "Remote",
    type: "Full-time",
    description:
      "Shape the learning experience from first-time user onboarding to daily conversation practice. You will design intuitive flows for complex features like real-time corrections, vocabulary review, and progress tracking, balancing information density with clarity and delight.",
  },
  {
    title: "Content & Curriculum Lead",
    department: "Education",
    location: "Remote",
    type: "Full-time",
    description:
      "Develop and curate conversation scenarios, grammar correction explanations, and vocabulary contexts across all supported language pairs. You will define the pedagogical framework that guides our AI responses and ensure learning quality across Arabic, English, Spanish, and French.",
  },
  {
    title: "Backend Engineer",
    department: "Engineering",
    location: "Remote",
    type: "Full-time",
    description:
      "Build and scale Convolo's server infrastructure, API routes, and database layer using Next.js API routes, Prisma, and PostgreSQL. You will ensure our backend handles conversation processing, subscription management, and analytics with reliability and performance.",
  },
];

const perks = [
  {
    title: "Fully Remote",
    description:
      "Work from anywhere in the world. We are a distributed team that values output over hours, and we trust you to manage your schedule in the way that makes you most productive and creative.",
  },
  {
    title: "Learning Budget",
    description:
      "Every team member receives an annual learning budget for courses, books, conferences, or any resource that helps you grow professionally. We practice what we preach — lifelong learning is core to our culture.",
  },
  {
    title: "Flexible Hours",
    description:
      "We do not track hours or enforce rigid schedules. Asynchronous communication is our default, with focused overlap hours for collaboration. We measure impact, not screen time.",
  },
  {
    title: "Competitive Equity",
    description:
      "As an early team member, you will receive meaningful equity alongside competitive compensation. We want everyone on the team to be invested in Convolo's long-term success.",
  },
];

export default function CareersPage() {
  return (
    <div className="bg-[var(--bg-base)] py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <FadeInSection className="mb-20 text-center">
          <h1
            className="mb-6 text-3xl font-bold text-[var(--text-primary)] sm:text-4xl md:text-5xl"
            style={{ fontFamily: "var(--font-heading-cfg)" }}
          >
            Help Us <span className="gradient-conbolo-text">Unlock Fluency</span> for Everyone
          </h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-[var(--text-secondary)]">
            We are building the future of language learning — one conversation at a time. Join a
            team that believes in the power of real practice, innovative AI, and making education
            accessible to all.
          </p>
        </FadeInSection>

        {/* Perks */}
        <FadeInSection className="mb-20">
          <h2
            className="mb-8 text-center text-2xl font-bold text-[var(--text-primary)] sm:text-3xl"
            style={{ fontFamily: "var(--font-heading-cfg)" }}
          >
            Why <span className="gradient-conbolo-text">Convolo?</span>
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {perks.map((perk, i) => (
              <FadeInSection key={perk.title} delay={i * 0.1}>
                <div className="h-full rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-6">
                  <h3
                    className="mb-3 text-lg font-semibold text-[var(--text-primary)]"
                    style={{ fontFamily: "var(--font-heading-cfg)" }}
                  >
                    {perk.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                    {perk.description}
                  </p>
                </div>
              </FadeInSection>
            ))}
          </div>
        </FadeInSection>

        {/* Open Positions */}
        <FadeInSection>
          <h2
            className="mb-8 text-center text-2xl font-bold text-[var(--text-primary)] sm:text-3xl"
            style={{ fontFamily: "var(--font-heading-cfg)" }}
          >
            Open <span className="gradient-conbolo-text">Positions</span>
          </h2>
          <div className="space-y-4">
            {openPositions.map((position, i) => (
              <FadeInSection key={position.title} delay={i * 0.1}>
                <div className="group rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 transition-all duration-300 hover:border-[var(--accent-primary)]/30 hover:shadow-[var(--shadow-md)]">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1">
                      <h3
                        className="mb-2 text-lg font-semibold text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent-primary)]"
                        style={{ fontFamily: "var(--font-heading-cfg)" }}
                      >
                        {position.title}
                      </h3>
                      <div className="mb-3 flex flex-wrap items-center gap-3">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent-light)] px-3 py-1 text-xs font-medium text-[var(--accent-primary)] dark:text-[var(--accent-hover)]">
                          <Briefcase className="h-3 w-3" />
                          {position.department}
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--bg-elevated)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
                          <MapPin className="h-3 w-3" />
                          {position.location}
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--bg-elevated)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
                          <Clock className="h-3 w-3" />
                          {position.type}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                        {position.description}
                      </p>
                    </div>
                    <a
                      href={`mailto:careers@convolo.app?subject=Application: ${position.title}`}
                      className="gradient-conbolo inline-flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-sm font-medium whitespace-nowrap text-white transition-opacity hover:opacity-90"
                    >
                      Apply
                      <ArrowRight className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              </FadeInSection>
            ))}
          </div>
        </FadeInSection>
      </div>
    </div>
  );
}
