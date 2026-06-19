import type { Metadata } from "next";
import Link from "next/link";
import { FadeInSection } from "@/components/marketing/fade-in-section";
import { ArrowRight, Calendar, Clock, Tag } from "lucide-react";

export const metadata: Metadata = {
  title: "Blog — Convolo",
  description:
    "Insights on language learning, AI tutoring, and fluency development from the Convolo team.",
};

const blogPosts = [
  {
    slug: "why-conversation-beats-memorization",
    title: "Why Conversation Beats Memorization for Language Learning",
    excerpt:
      "Research consistently shows that active production — speaking, writing, and conversing — leads to far stronger retention than passive recognition. We explore the science behind why conversation practice is the most effective path to fluency, and how AI is making it accessible to everyone.",
    date: "June 15, 2026",
    readTime: "6 min read",
    category: "Learning Science",
  },
  {
    slug: "how-ai-tutors-adapt-to-your-level",
    title: "How AI Tutors Adapt to Your Level in Real-Time",
    excerpt:
      "One of the biggest challenges in language learning is finding practice that is neither too easy nor too hard. Our adaptive AI system adjusts vocabulary complexity, grammar structures, and conversation speed based on your real-time performance — creating a personalized learning curve that keeps you in the optimal zone for growth.",
    date: "June 8, 2026",
    readTime: "5 min read",
    category: "Behind the Tech",
  },
  {
    slug: "arabic-to-french-learning-journey",
    title: "From Arabic to French: A Learner's Journey with Convolo",
    excerpt:
      "We spoke with Ahmed, a software engineer from Cairo, about his experience using Convolo to learn French from scratch. His story illustrates how flexible language pairs and real-world scenario practice can transform the learning experience for non-English speakers.",
    date: "May 28, 2026",
    readTime: "7 min read",
    category: "Learner Stories",
  },
  {
    slug: "spaced-repetition-vocabulary",
    title: "Spaced Repetition: The Science Behind Smart Vocabulary Review",
    excerpt:
      "Our Smart Vocabulary Book automatically saves words you encounter in conversation and schedules them for review using spaced repetition algorithms. This article breaks down the science of forgetting curves and how strategic review timing can make vocabulary stick permanently.",
    date: "May 20, 2026",
    readTime: "5 min read",
    category: "Learning Science",
  },
  {
    slug: "building-conversations-with-gemini",
    title: "Building Natural Conversations with Google Gemini",
    excerpt:
      "A technical deep-dive into how we engineer prompts, manage context windows, and structure AI responses to create conversations that feel natural and pedagogically sound. We share our approach to balancing fluency practice with real-time corrections.",
    date: "May 12, 2026",
    readTime: "8 min read",
    category: "Behind the Tech",
  },
  {
    slug: "setting-daily-practice-goals",
    title: "How to Set (and Keep) Daily Language Practice Goals",
    excerpt:
      "Consistency is the single most important factor in language learning success. We share evidence-based strategies for building a daily practice habit, from micro-sessions to streak mechanics, and how Convolo's goal system helps you stay on track even on busy days.",
    date: "May 5, 2026",
    readTime: "4 min read",
    category: "Tips & Strategies",
  },
];

export default function BlogPage() {
  return (
    <div className="bg-[var(--bg-base)] py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <FadeInSection className="mb-16 text-center">
          <h1
            className="mb-4 text-3xl font-bold text-[var(--text-primary)] sm:text-4xl md:text-5xl"
            style={{ fontFamily: "var(--font-heading-cfg)" }}
          >
            The Convolo <span className="gradient-conbolo-text">Blog</span>
          </h1>
          <p className="mx-auto max-w-xl text-lg text-[var(--text-secondary)]">
            Insights on language learning, AI technology, and the journey to fluency from our team
            and community.
          </p>
        </FadeInSection>

        {/* Blog Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {blogPosts.map((post, i) => (
            <FadeInSection key={post.slug} delay={i * 0.1}>
              <article className="group flex h-full flex-col rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--accent-primary)]/30 hover:shadow-[var(--shadow-md)]">
                {/* Category */}
                <div className="mb-4 flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent-light)] px-3 py-1 text-xs font-medium text-[var(--accent-primary)] dark:text-[var(--accent-hover)]">
                    <Tag className="h-3 w-3" />
                    {post.category}
                  </span>
                </div>

                {/* Title */}
                <h2
                  className="mb-3 text-lg font-semibold text-[var(--text-primary)] transition-colors group-hover:text-[var(--accent-primary)]"
                  style={{ fontFamily: "var(--font-heading-cfg)" }}
                >
                  {post.title}
                </h2>

                {/* Excerpt */}
                <p className="mb-4 flex-1 text-sm leading-relaxed text-[var(--text-secondary)]">
                  {post.excerpt}
                </p>

                {/* Meta */}
                <div className="flex items-center justify-between border-t border-[var(--border-default)] pt-4">
                  <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {post.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {post.readTime}
                    </span>
                  </div>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="flex items-center gap-1 text-xs font-medium text-[var(--accent-primary)] transition-colors hover:text-[var(--accent-hover)]"
                  >
                    Read more
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </article>
            </FadeInSection>
          ))}
        </div>
      </div>
    </div>
  );
}
