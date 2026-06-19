import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Convolo",
  description:
    "Learn how Convolo handles your personal data, conversation records, and privacy preferences.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-[var(--bg-base)] py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1
          className="mb-4 text-3xl font-bold text-[var(--text-primary)] sm:text-4xl md:text-5xl"
          style={{ fontFamily: "var(--font-heading-cfg)" }}
        >
          Privacy Policy
        </h1>
        <p className="mb-10 text-sm text-[var(--text-muted)]">Last updated: June 2026</p>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
          <section>
            <h2
              className="mb-3 text-xl font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-heading-cfg)" }}
            >
              1. Introduction
            </h2>
            <p className="leading-relaxed text-[var(--text-secondary)]">
              Convolo (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to
              protecting your privacy. This Privacy Policy explains how we collect, use, disclose,
              and safeguard your information when you use our conversational language learning
              platform at convolo.vercel.app and any related services. Please read this policy
              carefully. By accessing or using Convolo, you agree to the terms outlined in this
              Privacy Policy. If you do not agree, please do not use our services.
            </p>
          </section>

          <section>
            <h2
              className="mb-3 text-xl font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-heading-cfg)" }}
            >
              2. Information We Collect
            </h2>
            <p className="mb-4 leading-relaxed text-[var(--text-secondary)]">
              We collect information to provide and improve our language learning services. The
              types of information we collect include:
            </p>
            <ul className="list-disc space-y-2 pl-6 text-[var(--text-secondary)]">
              <li>
                <strong className="text-[var(--text-primary)]">Account Information:</strong> When
                you sign up, we collect your name, email address, and authentication credentials
                (via Google OAuth or email/password). This information is necessary to create and
                manage your account.
              </li>
              <li>
                <strong className="text-[var(--text-primary)]">Learning Data:</strong> We collect
                data about your learning activities, including conversation history, vocabulary
                progress, streak counts, achievement records, and skill assessments. This data
                powers your personalized learning experience and progress tracking.
              </li>
              <li>
                <strong className="text-[var(--text-primary)]">Usage Data:</strong> We automatically
                collect information about how you interact with our platform, including page visits,
                feature usage, session duration, and device/browser information. This helps us
                understand how learners use Convolo and identify areas for improvement.
              </li>
              <li>
                <strong className="text-[var(--text-primary)]">Payment Information:</strong> If you
                subscribe to Convolo Pro, we collect billing information through our payment
                processor, Stripe. We do not store credit card numbers on our servers — Stripe
                handles all payment data securely.
              </li>
            </ul>
          </section>

          <section>
            <h2
              className="mb-3 text-xl font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-heading-cfg)" }}
            >
              3. How We Use Your Information
            </h2>
            <p className="mb-4 leading-relaxed text-[var(--text-secondary)]">
              We use the information we collect to provide, maintain, and improve our services.
              Specifically, we use your data to:
            </p>
            <ul className="list-disc space-y-2 pl-6 text-[var(--text-secondary)]">
              <li>Provide personalized AI conversation tutoring adapted to your level</li>
              <li>Track your learning progress and display achievements and streaks</li>
              <li>Process subscription payments and manage your Pro account</li>
              <li>Send you product updates, learning reminders, and support communications</li>
              <li>Analyze usage patterns to improve our AI models and platform features</li>
              <li>Enforce our Terms of Service and prevent fraudulent activity</li>
            </ul>
          </section>

          <section>
            <h2
              className="mb-3 text-xl font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-heading-cfg)" }}
            >
              4. Conversation Data &amp; AI Processing
            </h2>
            <p className="leading-relaxed text-[var(--text-secondary)]">
              Your conversations with the AI tutor are processed through Google Gemini to generate
              responses, corrections, and feedback. These conversations are stored in your account
              history and are encrypted at rest. We do not use your conversation data to train AI
              models for third parties. Your conversations are private to your account and are never
              shared with other users. You can delete your conversation history at any time from
              your account settings, and deletion is permanent and irreversible.
            </p>
          </section>

          <section>
            <h2
              className="mb-3 text-xl font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-heading-cfg)" }}
            >
              5. Data Sharing &amp; Third Parties
            </h2>
            <p className="mb-4 leading-relaxed text-[var(--text-secondary)]">
              We do not sell, trade, or rent your personal information to third parties. We share
              data only with service providers who help us operate Convolo:
            </p>
            <ul className="list-disc space-y-2 pl-6 text-[var(--text-secondary)]">
              <li>
                <strong className="text-[var(--text-primary)]">Google Gemini:</strong> Processes
                your conversation inputs to generate AI responses
              </li>
              <li>
                <strong className="text-[var(--text-primary)]">Stripe:</strong> Processes payment
                information for Pro subscriptions
              </li>
              <li>
                <strong className="text-[var(--text-primary)]">Supabase:</strong> Hosts our database
                with encryption at rest and in transit
              </li>
              <li>
                <strong className="text-[var(--text-primary)]">Vercel:</strong> Hosts our
                application and collects basic analytics
              </li>
            </ul>
          </section>

          <section>
            <h2
              className="mb-3 text-xl font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-heading-cfg)" }}
            >
              6. Data Retention &amp; Deletion
            </h2>
            <p className="leading-relaxed text-[var(--text-secondary)]">
              We retain your account data for as long as your account is active. If you request
              account deletion, we will permanently remove your personal information and
              conversation history within 30 days, except where retention is required by law.
              Anonymized usage statistics may be retained for analytics purposes, but these cannot
              be linked back to you individually. You can request a copy of your data or request
              deletion by contacting us at privacy@convolo.app.
            </p>
          </section>

          <section>
            <h2
              className="mb-3 text-xl font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-heading-cfg)" }}
            >
              7. Data Security
            </h2>
            <p className="leading-relaxed text-[var(--text-secondary)]">
              We implement industry-standard security measures to protect your data, including
              encryption in transit (TLS 1.3), encryption at rest (AES-256), secure authentication
              (OAuth 2.0), and regular security audits. While no system is completely secure, we
              continuously work to protect your information from unauthorized access, alteration,
              disclosure, or destruction. In the event of a data breach, we will notify affected
              users within 72 hours as required by applicable law.
            </p>
          </section>

          <section>
            <h2
              className="mb-3 text-xl font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-heading-cfg)" }}
            >
              8. Your Rights
            </h2>
            <p className="mb-4 leading-relaxed text-[var(--text-secondary)]">
              Depending on your location, you may have the following rights regarding your personal
              data:
            </p>
            <ul className="list-disc space-y-2 pl-6 text-[var(--text-secondary)]">
              <li>Access and download a copy of your personal data</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data and account</li>
              <li>Object to or restrict certain data processing activities</li>
              <li>Data portability — receive your data in a structured format</li>
            </ul>
            <p className="mt-4 leading-relaxed text-[var(--text-secondary)]">
              To exercise any of these rights, please contact us at privacy@convolo.app. We will
              respond to your request within 30 days.
            </p>
          </section>

          <section>
            <h2
              className="mb-3 text-xl font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-heading-cfg)" }}
            >
              9. Children&apos;s Privacy
            </h2>
            <p className="leading-relaxed text-[var(--text-secondary)]">
              Convolo is not intended for children under the age of 13. We do not knowingly collect
              personal information from children under 13. If we learn that we have collected data
              from a child under 13, we will take steps to delete that information promptly. If you
              believe a child under 13 has provided us with personal information, please contact us
              immediately.
            </p>
          </section>

          <section>
            <h2
              className="mb-3 text-xl font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-heading-cfg)" }}
            >
              10. Changes to This Policy
            </h2>
            <p className="leading-relaxed text-[var(--text-secondary)]">
              We may update this Privacy Policy from time to time. We will notify you of any
              material changes by posting the new policy on our website and updating the &quot;Last
              updated&quot; date. Your continued use of Convolo after any changes constitutes
              acceptance of the updated policy. We encourage you to review this page periodically
              for the latest information on our privacy practices.
            </p>
          </section>

          <section>
            <h2
              className="mb-3 text-xl font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-heading-cfg)" }}
            >
              11. Contact Us
            </h2>
            <p className="leading-relaxed text-[var(--text-secondary)]">
              If you have any questions about this Privacy Policy or our data practices, please
              contact us at{" "}
              <a
                href="mailto:privacy@convolo.app"
                className="text-[var(--accent-primary)] transition-colors hover:text-[var(--accent-hover)]"
              >
                privacy@convolo.app
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
