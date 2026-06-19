import { Check, X, ChevronRight, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FadeInSection } from "@/components/marketing/fade-in-section";

const pricingPlans = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    cta: "Get Started",
    highlight: false,
    features: [
      { text: "3 conversations/day", included: true },
      { text: "Basic scenarios", included: true },
      { text: "Limited vocabulary book", included: true },
      { text: "Basic progress tracking", included: true },
      { text: "Priority AI responses", included: false },
      { text: "Early access to new features", included: false },
    ],
  },
  {
    name: "Pro",
    price: "$9.99",
    period: "/month",
    yearlyPrice: "$79.99/year",
    cta: "Start Pro Trial",
    highlight: true,
    features: [
      { text: "Unlimited conversations", included: true },
      { text: "All scenarios including premium", included: true },
      { text: "Full vocabulary book + SRS", included: true },
      { text: "Detailed analytics & reports", included: true },
      { text: "Priority AI responses", included: true },
      { text: "Early access to new features", included: true },
    ],
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="bg-[var(--bg-surface)] py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeInSection className="mb-16 text-center">
          <h2
            className="mb-4 text-3xl font-bold text-[var(--text-primary)] sm:text-4xl md:text-5xl"
            style={{ fontFamily: "var(--font-heading-cfg)" }}
          >
            Simple, <span className="gradient-conbolo-text">Transparent</span> Pricing
          </h2>
          <p className="mx-auto max-w-xl text-lg text-[var(--text-secondary)]">
            Start free, upgrade when you&apos;re ready. No hidden fees, cancel anytime.
          </p>
        </FadeInSection>

        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-2">
          {pricingPlans.map((plan, i) => (
            <FadeInSection key={plan.name} delay={i * 0.15}>
              <div
                className={`relative h-full rounded-2xl p-[2px] ${
                  plan.highlight ? "gradient-conbolo" : "bg-[var(--border-default)]"
                }`}
              >
                {/* Popular badge for Pro */}
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 z-10 -translate-x-1/2">
                    <span className="gradient-conbolo inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold text-white shadow-[var(--shadow-glow)]">
                      <Crown className="h-3.5 w-3.5" />
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="flex h-full flex-col rounded-[14px] bg-[var(--bg-surface)] p-6 sm:p-8">
                  <div className="mb-6">
                    <h3
                      className="mb-1 text-xl font-semibold text-[var(--text-primary)]"
                      style={{ fontFamily: "var(--font-heading-cfg)" }}
                    >
                      {plan.name}
                    </h3>
                    <div className="flex items-baseline gap-1">
                      <span
                        className="text-4xl font-bold text-[var(--text-primary)] sm:text-5xl"
                        style={{ fontFamily: "var(--font-heading-cfg)" }}
                      >
                        {plan.price}
                      </span>
                      <span className="text-sm text-[var(--text-muted)]">{plan.period}</span>
                    </div>
                    {"yearlyPrice" in plan && (
                      <p className="mt-1 text-sm font-medium text-[var(--accent-secondary)]">
                        or {plan.yearlyPrice}
                      </p>
                    )}
                  </div>

                  <ul className="mb-8 flex-1 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature.text} className="flex items-start gap-3">
                        {feature.included ? (
                          <Check className="mt-0.5 h-5 w-5 shrink-0 text-[var(--state-success)]" />
                        ) : (
                          <X className="mt-0.5 h-5 w-5 shrink-0 text-[var(--text-muted)]" />
                        )}
                        <span
                          className={`text-sm ${
                            feature.included
                              ? "text-[var(--text-primary)]"
                              : "text-[var(--text-muted)]"
                          }`}
                        >
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    size="lg"
                    className={`h-12 w-full rounded-xl text-base font-semibold ${
                      plan.highlight
                        ? "gradient-conbolo border-0 text-white shadow-[var(--shadow-glow)] transition-opacity hover:opacity-90"
                        : "border border-[var(--border-default)] bg-[var(--bg-elevated)] text-[var(--text-primary)] hover:bg-[var(--border-default)]"
                    }`}
                  >
                    {plan.cta}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </FadeInSection>
          ))}
        </div>
      </div>
    </section>
  );
}
