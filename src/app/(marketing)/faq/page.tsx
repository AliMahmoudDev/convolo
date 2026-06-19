"use client";

import type { Metadata } from "next";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FadeInSection } from "@/components/marketing/fade-in-section";
import { HelpCircle, Search, MessageSquare } from "lucide-react";
import Link from "next/link";

/* Note: metadata export is not supported in client components.
   This page needs to be a client component due to Accordion.
   For production, consider extracting the Accordion into a client sub-component
   and making this page a Server Component with metadata. */

const generalFaqs = [
  {
    question: "What is Convolo?",
    answer:
      "Convolo is an AI-powered conversational language learning platform that helps you build fluency through real dialogue practice. Instead of flashcards and translation exercises, you have natural conversations with an AI tutor that adapts to your level, corrects your mistakes in real time, and helps you develop the confidence to speak in your target language. Think of it as having a patient, always-available language partner.",
  },
  {
    question: "How is Convolo different from Duolingo or other language apps?",
    answer:
      "Traditional language apps focus on translation exercises, matching games, and flashcards — they teach recognition, not production. Convolo focuses on the skill that matters most: having real conversations. You practice speaking and writing in context, receive instant corrections with explanations, and build the conversational muscle memory needed for real-world communication. Research consistently shows that active production leads to far stronger learning outcomes than passive recognition.",
  },
  {
    question: "What languages does Convolo support?",
    answer:
      "Currently, we support Arabic, English, Spanish, and French — in any combination. That means 12 possible language pairs, including less common combinations like Arabic-to-French or Spanish-to-Arabic. We chose these languages to serve diverse learner communities, and we plan to add more languages based on user demand. You can vote for your preferred language on our Contact page.",
  },
  {
    question: "Is Convolo suitable for complete beginners?",
    answer:
      "Yes! Our adaptive AI adjusts to any proficiency level. Complete beginners start with simple exchanges — greetings, basic questions, and common phrases — and gradually build complexity as their skills improve. The AI provides extra context and simpler vocabulary for beginners, then naturally increases difficulty as you gain confidence. Many of our most successful learners started with zero knowledge of their target language.",
  },
  {
    question: "How does the AI tutor work?",
    answer:
      "Convolo uses Google Gemini, a state-of-the-art large language model, to power our AI tutor. When you have a conversation, your input is sent to our server, processed by Gemini with carefully engineered prompts that ensure pedagogically sound responses, and the result is delivered back to you with corrections and feedback. The AI maintains conversation context, adapts to your level, and provides corrections in your native language for better understanding.",
  },
];

const technicalFaqs = [
  {
    question: "Is my conversation data private?",
    answer:
      "Absolutely. Your conversations are encrypted in transit (TLS 1.3) and at rest (AES-256). We never share your conversation data with third parties, and we do not use it to train AI models. You can delete your conversation history at any time from your account settings, and deletion is permanent and irreversible. We take your privacy seriously — your learning journey is yours alone.",
  },
  {
    question: "What technology does Convolo use?",
    answer:
      "Convolo is built with Next.js, TypeScript, and Tailwind CSS on the frontend, with Prisma and PostgreSQL (via Supabase) for data storage. Our AI conversations are powered by Google Gemini through an adapter pattern that allows us to switch providers if needed. Authentication is handled by NextAuth.js with support for email and Google OAuth. The platform is deployed on Vercel for optimal performance and global availability.",
  },
  {
    question: "Does Convolo work on mobile devices?",
    answer:
      "Yes! Convolo is a responsive web application that works seamlessly on smartphones, tablets, laptops, and desktops. We design mobile-first, so the conversation experience is optimized for touch interfaces and smaller screens. You can add Convolo to your home screen for an app-like experience without needing to download anything from the app store.",
  },
  {
    question: "Why are free users limited to 3 conversations per day?",
    answer:
      "Each AI conversation requires computational resources, and we use Google Gemini's free tier to keep our costs near zero. The 3-conversation daily limit allows us to offer a genuinely useful free tier while keeping the service sustainable. Most learners find that 3 focused conversations per day, combined with vocabulary review, is enough to build a strong daily practice habit. If you need more, Pro offers unlimited conversations.",
  },
];

const accountFaqs = [
  {
    question: "How do I sign up?",
    answer:
      "You can create a free Convolo account using your email address or Google account. Simply click the 'Sign Up Free' button on our homepage, enter your details, and you will be guided through a quick onboarding flow where you select your native language, target language, proficiency level, and daily practice goal. The whole process takes less than 2 minutes.",
  },
  {
    question: "Can I cancel my Pro subscription anytime?",
    answer:
      "Yes, you can cancel anytime from your account settings. There are no cancellation fees, no hoops to jump through, and no questions asked. After cancellation, you will retain Pro access until the end of your current billing period (monthly or yearly). When your Pro period ends, your account automatically reverts to the Free tier, and all your data, progress, and vocabulary are preserved.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit and debit cards (Visa, Mastercard, American Express) through Stripe, our payment processor. Your payment information is handled entirely by Stripe and is never stored on Convolo's servers. We also support Apple Pay and Google Pay where available. All transactions are secured with bank-level encryption.",
  },
  {
    question: "How do I delete my account?",
    answer:
      "You can delete your account from your Settings page. Account deletion is permanent and irreversible — it removes all your conversation history, vocabulary data, progress records, and personal information within 30 days. If you have an active Pro subscription, please cancel it before deleting your account to avoid further charges.",
  },
];

function FaqCategory({
  title,
  faqs,
  startIdx,
}: {
  title: string;
  faqs: { question: string; answer: string }[];
  startIdx: number;
}) {
  return (
    <FadeInSection className="mb-12">
      <h2
        className="mb-6 text-xl font-semibold text-[var(--text-primary)]"
        style={{ fontFamily: "var(--font-heading-cfg)" }}
      >
        {title}
      </h2>
      <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-2">
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`faq-${startIdx + i}`}
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
  );
}

export default function FAQPage() {
  return (
    <div className="bg-[var(--bg-base)] py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <FadeInSection className="mb-16 text-center">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--accent-primary)]/30 bg-[var(--accent-light)]/50 px-4 py-1.5 text-xs font-medium text-[var(--accent-primary)] backdrop-blur-sm dark:text-[var(--accent-hover)]">
            <HelpCircle className="h-3.5 w-3.5" />
            Help Center
          </span>
          <h1
            className="mb-4 text-3xl font-bold text-[var(--text-primary)] sm:text-4xl md:text-5xl"
            style={{ fontFamily: "var(--font-heading-cfg)" }}
          >
            Frequently Asked <span className="gradient-conbolo-text">Questions</span>
          </h1>
          <p className="mx-auto max-w-xl text-lg text-[var(--text-secondary)]">
            Everything you need to know about Convolo. Can&apos;t find the answer you&apos;re
            looking for?{" "}
            <Link
              href="/contact"
              className="font-medium text-[var(--accent-primary)] transition-colors hover:text-[var(--accent-hover)]"
            >
              Contact us
            </Link>
            .
          </p>
        </FadeInSection>

        {/* FAQ Categories */}
        <FaqCategory title="General" faqs={generalFaqs} startIdx={0} />
        <FaqCategory
          title="Technical & Privacy"
          faqs={technicalFaqs}
          startIdx={generalFaqs.length}
        />
        <FaqCategory
          title="Account & Billing"
          faqs={accountFaqs}
          startIdx={generalFaqs.length + technicalFaqs.length}
        />

        {/* Still need help? */}
        <FadeInSection>
          <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-8 text-center">
            <MessageSquare className="mx-auto mb-4 h-10 w-10 text-[var(--accent-primary)]" />
            <h3
              className="mb-2 text-lg font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-heading-cfg)" }}
            >
              Still have questions?
            </h3>
            <p className="mx-auto mb-6 max-w-md text-sm text-[var(--text-secondary)]">
              Our team is here to help. Reach out and we will get back to you within 24 hours.
            </p>
            <Link
              href="/contact"
              className="gradient-conbolo inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Contact Support
            </Link>
          </div>
        </FadeInSection>
      </div>
    </div>
  );
}
