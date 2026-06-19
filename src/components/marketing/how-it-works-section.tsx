import { Languages, MessageSquare, SpellCheck, Zap } from "lucide-react";
import { FadeInSection } from "@/components/marketing/fade-in-section";

const steps = [
  {
    step: 1,
    icon: Languages,
    title: "Pick Your Languages",
    description: "Choose your native language and target language",
  },
  {
    step: 2,
    icon: MessageSquare,
    title: "Start Talking",
    description: "Jump into a conversation with your AI tutor",
  },
  {
    step: 3,
    icon: SpellCheck,
    title: "Get Feedback",
    description: "Receive instant corrections and vocabulary",
  },
  {
    step: 4,
    icon: Zap,
    title: "Level Up",
    description: "Track progress and unlock achievements",
  },
];

export function HowItWorksSection() {
  return (
    <section className="bg-[var(--bg-base)] py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeInSection className="mb-16 text-center">
          <h2
            className="mb-4 text-3xl font-bold text-[var(--text-primary)] sm:text-4xl md:text-5xl"
            style={{ fontFamily: "var(--font-heading-cfg)" }}
          >
            How It <span className="gradient-conbolo-text">Works</span>
          </h2>
          <p className="mx-auto max-w-xl text-lg text-[var(--text-secondary)]">
            From zero to fluent in four simple steps.
          </p>
        </FadeInSection>

        {/* Desktop/Tablet: Horizontal layout with connecting line */}
        <div className="relative hidden md:block">
          {/* Horizontal connecting line behind the icons */}
          <div
            className="absolute top-8 right-[calc(12.5%+32px)] left-[calc(12.5%+32px)] h-[2px]"
            style={{
              background:
                "linear-gradient(90deg, var(--accent-primary), var(--accent-secondary), var(--color-gold))",
            }}
          />

          <div className="grid grid-cols-4 gap-4">
            {steps.map((step, i) => (
              <FadeInSection key={step.step} delay={i * 0.15}>
                <div className="relative flex flex-col items-center text-center">
                  {/* Step Circle */}
                  <div className="gradient-conbolo relative z-10 mb-5 flex h-16 w-16 items-center justify-center rounded-2xl shadow-[var(--shadow-glow)]">
                    <step.icon className="h-7 w-7 text-white" />
                  </div>

                  {/* Step Number Badge */}
                  <span className="mb-3 inline-flex h-6 w-6 items-center justify-center rounded-full border border-[var(--border-default)] bg-[var(--bg-elevated)] text-xs font-semibold text-[var(--text-muted)]">
                    {step.step}
                  </span>

                  <h3
                    className="mb-2 text-lg font-semibold text-[var(--text-primary)]"
                    style={{ fontFamily: "var(--font-heading-cfg)" }}
                  >
                    {step.title}
                  </h3>
                  <p className="max-w-[200px] text-sm text-[var(--text-secondary)]">
                    {step.description}
                  </p>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>

        {/* Mobile: Vertical layout with connecting line */}
        <div className="relative md:hidden">
          {/* Vertical connecting line on the left */}
          <div
            className="absolute top-8 bottom-8 w-[2px]"
            style={{
              left: "31px",
              background:
                "linear-gradient(180deg, var(--accent-primary), var(--accent-secondary), var(--color-gold))",
            }}
          />

          <div className="flex flex-col gap-8">
            {steps.map((step, i) => (
              <FadeInSection key={step.step} delay={i * 0.1}>
                <div className="relative flex items-start gap-5">
                  {/* Step Circle */}
                  <div className="gradient-conbolo relative z-10 flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl shadow-[var(--shadow-glow)]">
                    <step.icon className="h-7 w-7 text-white" />
                  </div>

                  <div className="flex-1 pt-2">
                    {/* Step Number Badge */}
                    <span className="mb-2 inline-flex h-6 w-6 items-center justify-center rounded-full border border-[var(--border-default)] bg-[var(--bg-elevated)] text-xs font-semibold text-[var(--text-muted)]">
                      {step.step}
                    </span>

                    <h3
                      className="mb-1 text-lg font-semibold text-[var(--text-primary)]"
                      style={{ fontFamily: "var(--font-heading-cfg)" }}
                    >
                      {step.title}
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)]">{step.description}</p>
                  </div>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
