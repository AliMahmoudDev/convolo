import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — Convolo",
  description:
    "Read the Terms of Service for using Convolo's AI-powered language learning platform.",
};

export default function TermsOfServicePage() {
  return (
    <div className="bg-[var(--bg-base)] py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1
          className="mb-4 text-3xl font-bold text-[var(--text-primary)] sm:text-4xl md:text-5xl"
          style={{ fontFamily: "var(--font-heading-cfg)" }}
        >
          Terms of Service
        </h1>
        <p className="mb-10 text-sm text-[var(--text-muted)]">Last updated: June 2026</p>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
          <section>
            <h2
              className="mb-3 text-xl font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-heading-cfg)" }}
            >
              1. Acceptance of Terms
            </h2>
            <p className="leading-relaxed text-[var(--text-secondary)]">
              By accessing or using Convolo (&quot;the Service&quot;), you agree to be bound by
              these Terms of Service (&quot;Terms&quot;). If you do not agree to all of these Terms,
              do not use the Service. These Terms apply to all visitors, users, and others who
              access or use Convolo. We reserve the right to modify these Terms at any time, and
              your continued use of the Service after any changes indicates your acceptance of the
              new Terms.
            </p>
          </section>

          <section>
            <h2
              className="mb-3 text-xl font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-heading-cfg)" }}
            >
              2. Description of Service
            </h2>
            <p className="leading-relaxed text-[var(--text-secondary)]">
              Convolo is an AI-powered conversational language learning platform that enables users
              to practice speaking foreign languages through real-time dialogue with an AI tutor.
              The Service includes conversation practice, instant grammar corrections, vocabulary
              tracking, progress analytics, and scenario-based learning. We offer both free and Pro
              subscription tiers with different feature sets and usage limits as described on our
              Pricing page.
            </p>
          </section>

          <section>
            <h2
              className="mb-3 text-xl font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-heading-cfg)" }}
            >
              3. Account Registration
            </h2>
            <p className="leading-relaxed text-[var(--text-secondary)]">
              To use Convolo, you must create an account by providing your email address or signing
              in through Google OAuth. You are responsible for maintaining the confidentiality of
              your account credentials and for all activities that occur under your account. You
              must be at least 13 years old to create an account. You agree to provide accurate and
              complete information during registration and to update your information to keep it
              current. If you suspect unauthorized use of your account, you must notify us
              immediately at security@convolo.app.
            </p>
          </section>

          <section>
            <h2
              className="mb-3 text-xl font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-heading-cfg)" }}
            >
              4. Acceptable Use
            </h2>
            <p className="mb-4 leading-relaxed text-[var(--text-secondary)]">
              You agree to use Convolo only for its intended purpose — language learning and
              practice. You agree NOT to:
            </p>
            <ul className="list-disc space-y-2 pl-6 text-[var(--text-secondary)]">
              <li>Use the Service for any unlawful purpose or to promote illegal activities</li>
              <li>
                Attempt to reverse-engineer, decompile, or extract our AI models or algorithms
              </li>
              <li>Share your account credentials with others or allow third-party access</li>
              <li>
                Use automated scripts or bots to interact with the Service beyond normal usage
              </li>
              <li>
                Submit content that is harmful, offensive, discriminatory, or violates others&apos;
                rights
              </li>
              <li>Attempt to circumvent usage limits or subscription requirements</li>
              <li>
                Interfere with or disrupt the Service&apos;s infrastructure or other users&apos;
                experience
              </li>
            </ul>
          </section>

          <section>
            <h2
              className="mb-3 text-xl font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-heading-cfg)" }}
            >
              5. Subscription &amp; Payments
            </h2>
            <p className="leading-relaxed text-[var(--text-secondary)]">
              Convolo offers a free tier with limited daily conversations and a Pro subscription
              with unlimited access. Pro subscriptions are billed monthly ($9.99/month) or annually
              ($79.99/year) through Stripe. All prices are in USD. You may cancel your subscription
              at any time from your account settings. Upon cancellation, you will retain Pro access
              until the end of your current billing period. We do not offer prorated refunds for
              partial billing periods. Free tier usage limits (3 conversations per day) are enforced
              server-side and reset daily at midnight UTC.
            </p>
          </section>

          <section>
            <h2
              className="mb-3 text-xl font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-heading-cfg)" }}
            >
              6. Intellectual Property
            </h2>
            <p className="leading-relaxed text-[var(--text-secondary)]">
              The Convolo platform, including its design, logos, graphics, code, and AI prompt
              engineering, is owned by Convolo and protected by intellectual property laws. Your
              conversation content and learning data remain your property. By using the Service, you
              grant Convolo a limited license to process your conversation inputs through our AI
              provider to generate responses and feedback. We do not claim ownership of your
              learning content, and we do not use your conversations to train third-party AI models.
            </p>
          </section>

          <section>
            <h2
              className="mb-3 text-xl font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-heading-cfg)" }}
            >
              7. AI-Generated Content
            </h2>
            <p className="leading-relaxed text-[var(--text-secondary)]">
              Convolo uses AI (Google Gemini) to generate conversational responses, grammar
              corrections, and vocabulary feedback. While we strive for accuracy, AI-generated
              content may occasionally contain errors or inaccuracies. You should not rely solely on
              AI corrections for formal language certification or professional translation. Convolo
              is a learning tool designed for practice and improvement, and we make no guarantees
              regarding the accuracy or completeness of AI-generated feedback.
            </p>
          </section>

          <section>
            <h2
              className="mb-3 text-xl font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-heading-cfg)" }}
            >
              8. Limitation of Liability
            </h2>
            <p className="leading-relaxed text-[var(--text-secondary)]">
              To the maximum extent permitted by law, Convolo shall not be liable for any indirect,
              incidental, special, consequential, or punitive damages arising from your use of the
              Service. This includes, but is not limited to, damages for loss of data, learning
              progress, or profits. Our total liability to you for any claim arising from these
              Terms or the Service shall not exceed the amount you paid us in the 12 months
              preceding the claim. This limitation applies regardless of the legal theory on which
              the claim is based.
            </p>
          </section>

          <section>
            <h2
              className="mb-3 text-xl font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-heading-cfg)" }}
            >
              9. Termination
            </h2>
            <p className="leading-relaxed text-[var(--text-secondary)]">
              We may suspend or terminate your account if you violate these Terms. Upon termination,
              your right to use the Service will cease immediately. We will provide notice via email
              when possible. You may terminate your account at any time by deleting it from your
              settings or contacting us. Provisions of these Terms that by their nature should
              survive termination will remain in effect, including intellectual property provisions,
              limitation of liability, and dispute resolution clauses.
            </p>
          </section>

          <section>
            <h2
              className="mb-3 text-xl font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-heading-cfg)" }}
            >
              10. Governing Law
            </h2>
            <p className="leading-relaxed text-[var(--text-secondary)]">
              These Terms are governed by and construed in accordance with applicable laws, without
              regard to conflict of law principles. Any disputes arising from these Terms or the
              Service shall be resolved through good-faith negotiation first, and if unresolved,
              through binding arbitration. You agree to waive your right to a jury trial and to
              participate in class action lawsuits.
            </p>
          </section>

          <section>
            <h2
              className="mb-3 text-xl font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-heading-cfg)" }}
            >
              11. Contact
            </h2>
            <p className="leading-relaxed text-[var(--text-secondary)]">
              If you have questions about these Terms, please contact us at{" "}
              <a
                href="mailto:legal@convolo.app"
                className="text-[var(--accent-primary)] transition-colors hover:text-[var(--accent-hover)]"
              >
                legal@convolo.app
              </a>{" "}
              or visit our{" "}
              <a
                href="/contact"
                className="text-[var(--accent-primary)] transition-colors hover:text-[var(--accent-hover)]"
              >
                Contact page
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
