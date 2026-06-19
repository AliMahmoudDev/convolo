"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FadeInSection } from "@/components/marketing/fade-in-section";

const faqs = [
  {
    question: "How does Convolo teach languages?",
    answer:
      "Unlike traditional apps, Convolo focuses on real conversation practice with an AI tutor that adapts to your level and provides instant, contextual feedback. Instead of rote memorization, you learn by actively using the language in realistic scenarios, which research shows is far more effective for long-term retention and fluency development.",
  },
  {
    question: "Can I use Convolo as a complete beginner?",
    answer:
      "Yes! Our AI adjusts to any level. Beginners start with simple exchanges and gradually build complexity. The adaptive difficulty system ensures you are always challenged just enough to grow without feeling overwhelmed, making it perfect for those starting from scratch.",
  },
  {
    question: "What languages are available?",
    answer:
      "Currently: Arabic, English, Spanish, and French — in any combination. That means 12 possible language pairs! More languages coming soon based on community demand. We prioritize adding languages that our users request most.",
  },
  {
    question: "Is my conversation data private?",
    answer:
      "Absolutely. Your conversations are encrypted end-to-end and never shared with third parties. You can delete your data anytime from your account settings. We take privacy seriously — your learning journey is yours alone.",
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer:
      "Yes, cancel anytime from your settings. You'll keep Pro access until your current billing period ends. No questions asked, no hidden fees, no cancellation hoops to jump through.",
  },
  {
    question: "How is Convolo different from Duolingo or other apps?",
    answer:
      "While traditional apps focus on translation exercises and flashcards, Convolo immerses you in real conversations. You practice actual dialogue, receive contextual corrections, and build the confidence to speak — not just recognize words. Think of it as having a patient, AI-powered language partner available 24/7.",
  },
];

export function FAQSection() {
  return (
    <section id="faq" className="bg-[var(--bg-base)] py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <FadeInSection className="mb-12 text-center">
          <h2
            className="mb-4 text-3xl font-bold text-[var(--text-primary)] sm:text-4xl md:text-5xl"
            style={{ fontFamily: "var(--font-heading-cfg)" }}
          >
            Frequently Asked <span className="gradient-conbolo-text">Questions</span>
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
                  className="border-[var(--border-default)] px-4 last:border-b-0"
                >
                  <AccordionTrigger className="text-left text-[15px] font-medium text-[var(--text-primary)] hover:text-[var(--accent-primary)] hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm leading-relaxed text-[var(--text-secondary)]">
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
