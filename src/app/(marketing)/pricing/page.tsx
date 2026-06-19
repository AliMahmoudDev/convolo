import type { Metadata } from "next";
import Link from "next/link";
import { FadeInSection } from "@/components/marketing/fade-in-section";
import { Check, X, ChevronRight, Crown, ArrowRight, Shield, Zap, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Pricing — Convolo",
  description:
    "Simple, transparent pricing for Convolo. Start free with 3 daily conversations, or upgrade to Pro for unlimited access.",
};

const pricingPlans = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    cta: "Get Started",
    highlight: false,
    description: "Perfect for trying out Convolo and building a daily practice habit.",
    features: [
      { text: "3 conversations per day", included: true },
      { text: "Basic conversation scenarios", included: true },
      { text: "Limited vocabulary book (50 words)", included: true },
      { text: "Basic progress tracking & streaks", included: true },
      { text: "Instant grammar corrections", included: true },
      { text: "All language pairs (4 languages)", included: true },
      { text: "Priority AI responses", included: false },
      { text: "Full vocabulary book + SRS", included: false },
      { text: "Detailed analytics & reports", included: false },
      { text: "Premium scenarios", included: false },
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
    description: "Unlimited practice for serious learners who want to achieve fluency faster.",
    features: [
      { text: "Unlimited conversations", included: true },
      { text: "All conversation scenarios including premium", included: true },
      { text: "Full vocabulary book + spaced repetition", included: true },
      { text: "Detailed analytics & fluency reports", included: true },
      { text: "Instant grammar corrections", included: true },
      { text: "All language pairs (4 languages)", included: true },
      { text: "Priority AI responses (faster)", included: true },
      { text: "Export progress & vocabulary data", included: true },
      { text: "Custom scenario creation", included: true },
      { text: "Early access to new features", included: true },
      { text: "Priority support", included: true },
    ],
  },
];

const faqs = [
  {
    question: "Can I switch between Free and Pro at any time?",
    answer:
      "Absolutely. You can upgrade to Pro or downgrade to Free at any time from your account settings. If you downgrade, you will retain Pro access until the end of your current billing period, then revert to the Free tier with 3 daily conversations.",
  },
  {
    question: "Is there a free trial for Pro?",
    answer:
      "Yes! Every new Pro subscriber gets a 7-day free trial to experience all Pro features. You will not be charged until the trial ends, and you can cancel anytime during the trial with no charges.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit and debit cards (Visa, Mastercard, American Express) through Stripe. Your payment information is securely processed by Stripe and never stored on our servers.",
  },
  {
    question: "How does the yearly plan work?",
    answer:
      "The yearly Pro plan costs $79.99 per year, which works out to about $6.67 per month — a 33% savings compared to the monthly plan. You are billed once per year and can cancel anytime. You will retain Pro access until your annual period ends.",
  },
  {
    question: "What happens if I cancel my Pro subscription?",
    answer:
      "You will keep Pro access until the end of your current billing period (monthly or yearly). After that, your account will automatically revert to the Free tier. All your conversation history, vocabulary, and progress data are preserved — you just will not be able to access Pro-exclusive features.",
  },
];

export default function PricingPage() {
  return (
    <div className="bg-[var(--bg-base)] py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <FadeInSection className="mb-16 text-center">
          <h1
            className="mb-4 text-3xl font-bold text-[var(--text-primary)] sm:text-4xl md:text-5xl"
            style={{ fontFamily: "var(--font-heading-cfg)" }}
          >
            Simple, <span className="gradient-conbolo-text">Transparent</span> Pricing
          </h1>
          <p className="mx-auto max-w-xl text-lg text-[var(--text-secondary)]">
            Start free, upgrade when you&apos;re ready. No hidden fees, cancel anytime, and your
            data is always yours.
          </p>
        </FadeInSection>

        {/* Pricing Cards */}
        <div className="mb-20 grid grid-cols-1 gap-8 md:grid-cols-2">
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
                    <p className="mb-4 text-sm text-[var(--text-secondary)]">{plan.description}</p>
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
                        or {plan.yearlyPrice} (save 33%)
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

        {/* Trust badges */}
        <FadeInSection className="mb-20">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4">
              <Shield className="h-8 w-8 shrink-0 text-[var(--accent-primary)]" />
              <div>
                <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                  Secure Payments
                </h4>
                <p className="text-xs text-[var(--text-secondary)]">
                  Processed by Stripe, never stored
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4">
              <Zap className="h-8 w-8 shrink-0 text-[var(--accent-primary)]" />
              <div>
                <h4 className="text-sm font-semibold text-[var(--text-primary)]">Cancel Anytime</h4>
                <p className="text-xs text-[var(--text-secondary)]">No contracts, no commitments</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4">
              <CreditCard className="h-8 w-8 shrink-0 text-[var(--accent-primary)]" />
              <div>
                <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                  7-Day Free Trial
                </h4>
                <p className="text-xs text-[var(--text-secondary)]">Try Pro risk-free</p>
              </div>
            </div>
          </div>
        </FadeInSection>

        {/* FAQ */}
        <FadeInSection>
          <h2
            className="mb-8 text-center text-2xl font-bold text-[var(--text-primary)] sm:text-3xl"
            style={{ fontFamily: "var(--font-heading-cfg)" }}
          >
            Pricing <span className="gradient-conbolo-text">FAQ</span>
          </h2>
          <div className="mx-auto max-w-3xl space-y-4">
            {faqs.map((faq, i) => (
              <FadeInSection key={i} delay={i * 0.1}>
                <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-6">
                  <h3
                    className="mb-2 text-base font-semibold text-[var(--text-primary)]"
                    style={{ fontFamily: "var(--font-heading-cfg)" }}
                  >
                    {faq.question}
                  </h3>
                  <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                    {faq.answer}
                  </p>
                </div>
              </FadeInSection>
            ))}
          </div>
        </FadeInSection>
      </div>
    </div>
  );
}
