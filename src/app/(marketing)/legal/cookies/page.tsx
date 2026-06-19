import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy — Convolo",
  description:
    "Learn about how Convolo uses cookies and similar technologies to improve your experience.",
};

export default function CookiePolicyPage() {
  return (
    <div className="bg-[var(--bg-base)] py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1
          className="mb-4 text-3xl font-bold text-[var(--text-primary)] sm:text-4xl md:text-5xl"
          style={{ fontFamily: "var(--font-heading-cfg)" }}
        >
          Cookie Policy
        </h1>
        <p className="mb-10 text-sm text-[var(--text-muted)]">Last updated: June 2026</p>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
          <section>
            <h2
              className="mb-3 text-xl font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-heading-cfg)" }}
            >
              1. What Are Cookies?
            </h2>
            <p className="leading-relaxed text-[var(--text-secondary)]">
              Cookies are small text files stored on your device when you visit a website. They are
              widely used to make websites work more efficiently, provide a better user experience,
              and supply information to the site owners. Alongside cookies, we may also use similar
              technologies such as local storage and session storage, which function in comparable
              ways. This Cookie Policy explains what cookies we use, why we use them, and how you
              can manage your preferences.
            </p>
          </section>

          <section>
            <h2
              className="mb-3 text-xl font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-heading-cfg)" }}
            >
              2. How Convolo Uses Cookies
            </h2>
            <p className="leading-relaxed text-[var(--text-secondary)]">
              Convolo uses cookies and similar technologies for essential functionality, performance
              monitoring, and improving your learning experience. We categorize our cookies into the
              following types:
            </p>
          </section>

          <section>
            <h2
              className="mb-3 text-xl font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-heading-cfg)" }}
            >
              3. Essential Cookies
            </h2>
            <p className="mb-4 leading-relaxed text-[var(--text-secondary)]">
              These cookies are strictly necessary for the operation of Convolo. Without them, core
              features like authentication, session management, and security would not function.
              Essential cookies include:
            </p>
            <ul className="list-disc space-y-2 pl-6 text-[var(--text-secondary)]">
              <li>
                <strong className="text-[var(--text-primary)]">Session Cookie:</strong> Maintains
                your logged-in state as you navigate the platform. Without this cookie, you would
                need to re-authenticate on every page.
              </li>
              <li>
                <strong className="text-[var(--text-primary)]">CSRF Token:</strong> Protects against
                Cross-Site Request Forgery attacks, ensuring that requests made to our servers
                originate from legitimate sessions.
              </li>
              <li>
                <strong className="text-[var(--text-primary)]">Theme Preference:</strong> Stores
                your dark/light mode preference so the interface respects your choice on every visit
                without needing to re-select it.
              </li>
            </ul>
          </section>

          <section>
            <h2
              className="mb-3 text-xl font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-heading-cfg)" }}
            >
              4. Functional Cookies
            </h2>
            <p className="mb-4 leading-relaxed text-[var(--text-secondary)]">
              These cookies enable enhanced functionality and personalization. They are not
              essential for the core service but improve your experience:
            </p>
            <ul className="list-disc space-y-2 pl-6 text-[var(--text-secondary)]">
              <li>
                <strong className="text-[var(--text-primary)]">Language Pair Preference:</strong>{" "}
                Remembers your selected source and target languages so you can jump straight into
                practice without reconfiguring each session.
              </li>
              <li>
                <strong className="text-[var(--text-primary)]">Onboarding Progress:</strong> Tracks
                your progress through the initial setup flow so you can resume where you left off if
                you do not complete it in one sitting.
              </li>
            </ul>
          </section>

          <section>
            <h2
              className="mb-3 text-xl font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-heading-cfg)" }}
            >
              5. Analytics Cookies
            </h2>
            <p className="leading-relaxed text-[var(--text-secondary)]">
              We use analytics tools to understand how learners interact with Convolo, which
              features are most popular, and where we can make improvements. Analytics cookies
              collect anonymized data about page visits, session duration, feature usage, and error
              occurrences. This data is aggregated and cannot be used to identify you personally. We
              use this information solely to improve our platform and deliver a better learning
              experience. You may opt out of analytics cookies through your browser settings or our
              cookie preference center.
            </p>
          </section>

          <section>
            <h2
              className="mb-3 text-xl font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-heading-cfg)" }}
            >
              6. Third-Party Cookies
            </h2>
            <p className="mb-4 leading-relaxed text-[var(--text-secondary)]">
              Some third-party services we use may set their own cookies when you interact with
              Convolo:
            </p>
            <ul className="list-disc space-y-2 pl-6 text-[var(--text-secondary)]">
              <li>
                <strong className="text-[var(--text-primary)]">Google OAuth:</strong> Sets cookies
                during the sign-in process when you choose to authenticate with your Google account.
                These cookies are governed by Google&apos;s Privacy Policy.
              </li>
              <li>
                <strong className="text-[var(--text-primary)]">Stripe:</strong> May set cookies
                during the checkout process for Pro subscriptions. Stripe&apos;s cookies are
                necessary for secure payment processing and are governed by Stripe&apos;s Privacy
                Policy.
              </li>
              <li>
                <strong className="text-[var(--text-primary)]">Vercel Analytics:</strong> May set
                cookies for performance monitoring and web vitals tracking. These cookies help us
                identify and resolve performance issues quickly.
              </li>
            </ul>
          </section>

          <section>
            <h2
              className="mb-3 text-xl font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-heading-cfg)" }}
            >
              7. Managing Your Cookie Preferences
            </h2>
            <p className="leading-relaxed text-[var(--text-secondary)]">
              You can control and manage cookies in several ways. Most browsers allow you to refuse
              or accept cookies, delete existing cookies, and set preferences for certain websites.
              Please note that disabling essential cookies may affect the functionality of Convolo,
              and some features may not work as intended. You can typically find cookie settings in
              your browser&apos;s Preferences or Settings menu under the Privacy or Security
              section. For more detailed information about cookies and how to manage them, visit
              www.allaboutcookies.org.
            </p>
          </section>

          <section>
            <h2
              className="mb-3 text-xl font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-heading-cfg)" }}
            >
              8. Changes to This Cookie Policy
            </h2>
            <p className="leading-relaxed text-[var(--text-secondary)]">
              We may update this Cookie Policy from time to time to reflect changes in our practices
              or for other operational, legal, or regulatory reasons. We will post the updated
              version on this page with a revised &quot;Last updated&quot; date. We encourage you to
              review this policy periodically to stay informed about how we use cookies.
            </p>
          </section>

          <section>
            <h2
              className="mb-3 text-xl font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-heading-cfg)" }}
            >
              9. Contact Us
            </h2>
            <p className="leading-relaxed text-[var(--text-secondary)]">
              If you have any questions about our use of cookies or this Cookie Policy, please
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
