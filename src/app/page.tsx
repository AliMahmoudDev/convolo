"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  SpellCheck,
  Globe,
  BarChart3,
  BookOpen,
  Brain,
  ArrowRight,
  Check,
  X,
  Star,
  Users,
  MessagesSquare,
  Languages,
  ChevronRight,
  Zap,
  Crown,
  Play,
  Menu,
  XIcon,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

/* ================================================================
   ANIMATED SECTION WRAPPER
   ================================================================ */
function FadeInSection({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6, ease: "easeOut", delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ================================================================
   NAVBAR
   ================================================================ */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "FAQ", href: "#faq" },
  ];

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[var(--bg-base)]/80 backdrop-blur-xl border-b border-[var(--border-default)] shadow-[var(--shadow-sm)]"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2.5 group">
            <div className="relative w-8 h-8 rounded-lg gradient-conbolo flex items-center justify-center">
              <span className="text-white font-bold text-sm leading-none">
                C
              </span>
            </div>
            <span
              className="text-xl font-bold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-heading-cfg)" }}
            >
              Convolo
            </span>
          </a>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              Log In
            </Button>
            <Button
              size="sm"
              className="gradient-conbolo text-white border-0 hover:opacity-90 transition-opacity rounded-lg px-5"
            >
              Sign Up Free
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <XIcon className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="md:hidden border-t border-[var(--border-default)] bg-[var(--bg-base)]/95 backdrop-blur-xl"
          >
            <div className="px-4 py-4 space-y-3">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-3 border-t border-[var(--border-default)] flex flex-col gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-center text-[var(--text-secondary)]"
                >
                  Log In
                </Button>
                <Button
                  size="sm"
                  className="w-full gradient-conbolo text-white border-0 hover:opacity-90 transition-opacity rounded-lg"
                >
                  Sign Up Free
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

/* ================================================================
   HERO SECTION
   ================================================================ */
function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 hero-gradient-light dark:hero-gradient-dark" />

      {/* Dot pattern overlay */}
      <div className="absolute inset-0 dot-pattern opacity-30 dark:opacity-20" />

      {/* Gradient orb accents */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-[var(--accent-primary)] opacity-10 blur-[120px]" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-[var(--accent-secondary)] opacity-10 blur-[120px]" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 sm:pt-32 sm:pb-24 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)]/60 backdrop-blur-sm text-xs font-medium text-[var(--text-secondary)] mb-8">
            <Sparkles className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
            Now in Public Beta
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.1] tracking-tight text-[var(--text-primary)] mb-6"
          style={{ fontFamily: "var(--font-heading-cfg)" }}
        >
          Unlock Fluency Through
          <br />
          <span className="gradient-conbolo-text">Real Conversations</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="max-w-2xl mx-auto text-lg sm:text-xl text-[var(--text-secondary)] leading-relaxed mb-10"
          style={{ fontFamily: "var(--font-body)" }}
        >
          Stop memorizing flashcards. Start having real conversations with an AI
          tutor that adapts to your level, corrects your mistakes, and helps you
          build confidence — one chat at a time.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <Button
            size="lg"
            className="gradient-conbolo text-white border-0 hover:opacity-90 transition-all rounded-xl px-8 h-12 text-base font-semibold shadow-[var(--shadow-glow)]"
          >
            Start Learning Free
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="rounded-xl px-8 h-12 text-base font-medium border-[var(--border-default)] hover:bg-[var(--bg-elevated)] transition-all"
          >
            <Play className="w-4 h-4 mr-1" />
            Watch Demo
          </Button>
        </motion.div>

        {/* Social Proof Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 max-w-3xl mx-auto"
        >
          {[
            {
              icon: Users,
              value: "10,000+",
              label: "Learners",
            },
            {
              icon: MessagesSquare,
              value: "500K+",
              label: "Conversations",
            },
            {
              icon: Languages,
              value: "4",
              label: "Languages (More Soon)",
            },
            {
              icon: Star,
              value: "4.9/5",
              label: "Rating",
            },
          ].map((stat, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <stat.icon className="w-5 h-5 text-[var(--accent-primary)] mb-1" />
              <span
                className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]"
                style={{ fontFamily: "var(--font-heading-cfg)" }}
              >
                {stat.value}
              </span>
              <span className="text-xs sm:text-sm text-[var(--text-muted)]">
                {stat.label}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ================================================================
   FEATURES SECTION
   ================================================================ */
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

function FeaturesSection() {
  return (
    <section id="features" className="py-20 sm:py-28 bg-[var(--bg-surface)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeInSection className="text-center mb-16">
          <h2
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-4"
            style={{ fontFamily: "var(--font-heading-cfg)" }}
          >
            Everything You Need to{" "}
            <span className="gradient-conbolo-text">Speak Fluently</span>
          </h2>
          <p className="max-w-2xl mx-auto text-lg text-[var(--text-secondary)]">
            Powerful features designed to make language learning feel natural,
            effective, and actually enjoyable.
          </p>
        </FadeInSection>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <FadeInSection key={feature.title} delay={i * 0.1}>
              <div className="group relative h-full p-6 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-base)] hover:border-[var(--accent-primary)]/30 hover:shadow-[var(--shadow-md)] transition-all duration-300 hover:-translate-y-0.5">
                <div className="w-12 h-12 rounded-xl gradient-conbolo flex items-center justify-center mb-5 group-hover:shadow-[var(--shadow-glow)] transition-shadow duration-300">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3
                  className="text-xl font-semibold text-[var(--text-primary)] mb-3"
                  style={{ fontFamily: "var(--font-heading-cfg)" }}
                >
                  {feature.title}
                </h3>
                <p className="text-[var(--text-secondary)] leading-relaxed text-sm">
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

/* ================================================================
   HOW IT WORKS SECTION
   ================================================================ */
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

function HowItWorksSection() {
  return (
    <section className="py-20 sm:py-28 bg-[var(--bg-base)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeInSection className="text-center mb-16">
          <h2
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-4"
            style={{ fontFamily: "var(--font-heading-cfg)" }}
          >
            How It{" "}
            <span className="gradient-conbolo-text">Works</span>
          </h2>
          <p className="max-w-xl mx-auto text-lg text-[var(--text-secondary)]">
            From zero to fluent in four simple steps.
          </p>
        </FadeInSection>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-4 relative">
          {/* Connecting Line (desktop only) */}
          <div className="hidden md:block absolute top-16 left-[12.5%] right-[12.5%] h-[2px] bg-gradient-to-r from-[var(--accent-primary)] via-[var(--accent-secondary)] to-[var(--color-gold)]" />

          {steps.map((step, i) => (
            <FadeInSection key={step.step} delay={i * 0.15}>
              <div className="relative flex flex-col items-center text-center">
                {/* Step Circle */}
                <div className="relative z-10 w-16 h-16 rounded-2xl gradient-conbolo flex items-center justify-center mb-5 shadow-[var(--shadow-glow)]">
                  <step.icon className="w-7 h-7 text-white" />
                </div>

                {/* Step Number Badge */}
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-muted)] mb-3">
                  {step.step}
                </span>

                <h3
                  className="text-lg font-semibold text-[var(--text-primary)] mb-2"
                  style={{ fontFamily: "var(--font-heading-cfg)" }}
                >
                  {step.title}
                </h3>
                <p className="text-sm text-[var(--text-secondary)] max-w-[200px]">
                  {step.description}
                </p>
              </div>
            </FadeInSection>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ================================================================
   PRICING SECTION
   ================================================================ */
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

function PricingSection() {
  return (
    <section
      id="pricing"
      className="py-20 sm:py-28 bg-[var(--bg-surface)]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeInSection className="text-center mb-16">
          <h2
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-4"
            style={{ fontFamily: "var(--font-heading-cfg)" }}
          >
            Simple,{" "}
            <span className="gradient-conbolo-text">Transparent</span> Pricing
          </h2>
          <p className="max-w-xl mx-auto text-lg text-[var(--text-secondary)]">
            Start free, upgrade when you&apos;re ready. No hidden fees, cancel
            anytime.
          </p>
        </FadeInSection>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {pricingPlans.map((plan, i) => (
            <FadeInSection key={plan.name} delay={i * 0.15}>
              <div
                className={`relative h-full rounded-2xl p-[2px] ${
                  plan.highlight
                    ? "gradient-conbolo"
                    : "bg-[var(--border-default)]"
                }`}
              >
                {/* Popular badge for Pro */}
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                    <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full gradient-conbolo text-white text-xs font-semibold shadow-[var(--shadow-glow)]">
                      <Crown className="w-3.5 h-3.5" />
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="h-full rounded-[14px] bg-[var(--bg-surface)] p-6 sm:p-8 flex flex-col">
                  <div className="mb-6">
                    <h3
                      className="text-xl font-semibold text-[var(--text-primary)] mb-1"
                      style={{ fontFamily: "var(--font-heading-cfg)" }}
                    >
                      {plan.name}
                    </h3>
                    <div className="flex items-baseline gap-1">
                      <span
                        className="text-4xl sm:text-5xl font-bold text-[var(--text-primary)]"
                        style={{ fontFamily: "var(--font-heading-cfg)" }}
                      >
                        {plan.price}
                      </span>
                      <span className="text-[var(--text-muted)] text-sm">
                        {plan.period}
                      </span>
                    </div>
                    {"yearlyPrice" in plan && (
                      <p className="mt-1 text-sm text-[var(--accent-secondary)] font-medium">
                        or {plan.yearlyPrice}
                      </p>
                    )}
                  </div>

                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feature) => (
                      <li
                        key={feature.text}
                        className="flex items-start gap-3"
                      >
                        {feature.included ? (
                          <Check className="w-5 h-5 text-[var(--state-success)] shrink-0 mt-0.5" />
                        ) : (
                          <X className="w-5 h-5 text-[var(--text-muted)] shrink-0 mt-0.5" />
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
                    className={`w-full rounded-xl h-12 text-base font-semibold ${
                      plan.highlight
                        ? "gradient-conbolo text-white border-0 hover:opacity-90 transition-opacity shadow-[var(--shadow-glow)]"
                        : "bg-[var(--bg-elevated)] text-[var(--text-primary)] hover:bg-[var(--border-default)] border border-[var(--border-default)]"
                    }`}
                  >
                    {plan.cta}
                    <ChevronRight className="w-4 h-4" />
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

/* ================================================================
   FAQ SECTION
   ================================================================ */
const faqs = [
  {
    question: "How does Convolo teach languages?",
    answer:
      "Unlike traditional apps, Convolo focuses on real conversation practice with an AI tutor that adapts to your level and provides instant, contextual feedback.",
  },
  {
    question: "Can I use Convolo as a complete beginner?",
    answer:
      "Yes! Our AI adjusts to any level. Beginners start with simple exchanges and gradually build complexity.",
  },
  {
    question: "What languages are available?",
    answer:
      "Currently: Arabic, English, Spanish, and French — in any combination. More languages coming soon!",
  },
  {
    question: "Is my conversation data private?",
    answer:
      "Absolutely. Your conversations are encrypted and never shared. You can delete your data anytime.",
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer:
      "Yes, cancel anytime from your settings. You'll keep Pro access until your current period ends.",
  },
];

function FAQSection() {
  return (
    <section id="faq" className="py-20 sm:py-28 bg-[var(--bg-base)]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeInSection className="text-center mb-12">
          <h2
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-4"
            style={{ fontFamily: "var(--font-heading-cfg)" }}
          >
            Frequently Asked{" "}
            <span className="gradient-conbolo-text">Questions</span>
          </h2>
          <p className="text-lg text-[var(--text-secondary)]">
            Got questions? We&apos;ve got answers.
          </p>
        </FadeInSection>

        <FadeInSection>
          <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-2">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, i) => (
                <AccordionItem
                  key={i}
                  value={`faq-${i}`}
                  className="border-[var(--border-default)] last:border-b-0 px-4"
                >
                  <AccordionTrigger className="text-left text-[15px] font-medium text-[var(--text-primary)] hover:text-[var(--accent-primary)] hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-[var(--text-secondary)] text-sm leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </FadeInSection>
      </div>
    </section>
  );
}

/* ================================================================
   CTA SECTION
   ================================================================ */
function CTASection() {
  return (
    <section className="py-20 sm:py-28 relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 gradient-conbolo" />

      {/* Decorative elements */}
      <div className="absolute inset-0 dot-pattern opacity-10" />
      <div className="absolute top-0 left-1/4 w-72 h-72 rounded-full bg-white opacity-5 blur-[100px]" />
      <div className="absolute bottom-0 right-1/4 w-72 h-72 rounded-full bg-white opacity-5 blur-[100px]" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <FadeInSection>
          <h2
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-5"
            style={{ fontFamily: "var(--font-heading-cfg)" }}
          >
            Ready to Start Speaking?
          </h2>
          <p className="text-lg sm:text-xl text-white/80 mb-10 max-w-xl mx-auto">
            Join thousands of learners building fluency through real practice.
          </p>
          <Button
            size="lg"
            className="bg-white text-[var(--accent-primary)] hover:bg-white/90 rounded-xl px-10 h-14 text-base font-bold shadow-lg hover:shadow-xl transition-all"
          >
            Start Your Free Account
            <ArrowRight className="w-5 h-5 ml-1" />
          </Button>
        </FadeInSection>
      </div>
    </section>
  );
}

/* ================================================================
   FOOTER
   ================================================================ */
function Footer() {
  return (
    <footer className="bg-[var(--bg-surface)] border-t border-[var(--border-default)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand Column */}
          <div className="md:col-span-1">
            <a href="#" className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg gradient-conbolo flex items-center justify-center">
                <span className="text-white font-bold text-sm leading-none">
                  C
                </span>
              </div>
              <span
                className="text-xl font-bold text-[var(--text-primary)]"
                style={{ fontFamily: "var(--font-heading-cfg)" }}
              >
                Convolo
              </span>
            </a>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-[240px]">
              Conversation, Unlocked. Master any language through real
              conversations with AI.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4
              className="text-sm font-semibold text-[var(--text-primary)] mb-4"
              style={{ fontFamily: "var(--font-heading-cfg)" }}
            >
              Product
            </h4>
            <ul className="space-y-2.5">
              {["Features", "Pricing", "FAQ"].map((item) => (
                <li key={item}>
                  <a
                    href={`#${item.toLowerCase()}`}
                    className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4
              className="text-sm font-semibold text-[var(--text-primary)] mb-4"
              style={{ fontFamily: "var(--font-heading-cfg)" }}
            >
              Company
            </h4>
            <ul className="space-y-2.5">
              {["About", "Blog", "Careers", "Contact"].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4
              className="text-sm font-semibold text-[var(--text-primary)] mb-4"
              style={{ fontFamily: "var(--font-heading-cfg)" }}
            >
              Legal
            </h4>
            <ul className="space-y-2.5">
              {["Privacy Policy", "Terms of Service", "Cookie Policy"].map(
                (item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors"
                    >
                      {item}
                    </a>
                  </li>
                )
              )}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-[var(--border-default)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-[var(--text-muted)]">
            &copy; {new Date().getFullYear()} Convolo. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            {/* Social Icons */}
            {[
              {
                label: "Twitter",
                icon: (
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                ),
              },
              {
                label: "GitHub",
                icon: (
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                ),
              },
              {
                label: "LinkedIn",
                icon: (
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                ),
              },
            ].map((social) => (
              <a
                key={social.label}
                href="#"
                className="text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors"
                aria-label={social.label}
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ================================================================
   MAIN PAGE
   ================================================================ */
export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <PricingSection />
        <FAQSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
