"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, MessageSquare, Send, MapPin, Clock, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FadeInSection } from "@/components/marketing/fade-in-section";

const contactMethods = [
  {
    icon: Mail,
    title: "Email Us",
    description:
      "For general inquiries, partnerships, or press. We typically respond within 24 hours.",
    value: "hello@convolo.app",
    href: "mailto:hello@convolo.app",
  },
  {
    icon: MessageSquare,
    title: "Support",
    description:
      "Having trouble with your account or need technical help? Our support team is here.",
    value: "support@convolo.app",
    href: "mailto:support@convolo.app",
  },
  {
    icon: MapPin,
    title: "Visit Us",
    description: "Convolo is a fully remote company. Our team works from across the globe.",
    value: "Remote-first, worldwide",
    href: "/careers",
  },
  {
    icon: Clock,
    title: "Business Hours",
    description:
      "Our core team is available Monday through Friday, with async support on weekends.",
    value: "Mon–Fri, 9 AM – 6 PM UTC",
    href: undefined,
  },
];

export default function ContactPage() {
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production, this would submit to an API route
    setSubmitted(true);
  };

  return (
    <div className="bg-[var(--bg-base)] py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <FadeInSection className="mb-16 text-center">
          <h1
            className="mb-4 text-3xl font-bold text-[var(--text-primary)] sm:text-4xl md:text-5xl"
            style={{ fontFamily: "var(--font-heading-cfg)" }}
          >
            Get in <span className="gradient-conbolo-text">Touch</span>
          </h1>
          <p className="mx-auto max-w-xl text-lg text-[var(--text-secondary)]">
            Have a question, feedback, or partnership idea? We would love to hear from you. Our team
            typically responds within 24 hours.
          </p>
        </FadeInSection>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-5">
          {/* Contact Methods */}
          <div className="space-y-4 lg:col-span-2">
            {contactMethods.map((method, i) => (
              <FadeInSection key={method.title} delay={i * 0.1}>
                <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5">
                  <div className="flex items-start gap-4">
                    <div className="gradient-conbolo flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                      <method.icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3
                        className="mb-1 text-sm font-semibold text-[var(--text-primary)]"
                        style={{ fontFamily: "var(--font-heading-cfg)" }}
                      >
                        {method.title}
                      </h3>
                      <p className="mb-2 text-xs leading-relaxed text-[var(--text-secondary)]">
                        {method.description}
                      </p>
                      {method.href ? (
                        <a
                          href={method.href}
                          className="flex items-center gap-1 text-sm font-medium text-[var(--accent-primary)] transition-colors hover:text-[var(--accent-hover)]"
                        >
                          {method.value}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-sm font-medium text-[var(--text-primary)]">
                          {method.value}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </FadeInSection>
            ))}
          </div>

          {/* Contact Form */}
          <FadeInSection className="lg:col-span-3" delay={0.2}>
            <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 sm:p-8">
              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-12 text-center"
                >
                  <div className="gradient-conbolo mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full">
                    <Send className="h-7 w-7 text-white" />
                  </div>
                  <h3
                    className="mb-2 text-xl font-semibold text-[var(--text-primary)]"
                    style={{ fontFamily: "var(--font-heading-cfg)" }}
                  >
                    Message Sent!
                  </h3>
                  <p className="text-[var(--text-secondary)]">
                    Thanks for reaching out. We will get back to you within 24 hours.
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <h2
                    className="mb-2 text-xl font-semibold text-[var(--text-primary)]"
                    style={{ fontFamily: "var(--font-heading-cfg)" }}
                  >
                    Send Us a Message
                  </h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="name"
                        className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
                      >
                        Name
                      </label>
                      <input
                        id="name"
                        type="text"
                        required
                        value={formState.name}
                        onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                        className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] px-4 py-2.5 text-sm text-[var(--text-primary)] transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/30 focus:outline-none"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="email"
                        className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
                      >
                        Email
                      </label>
                      <input
                        id="email"
                        type="email"
                        required
                        value={formState.email}
                        onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                        className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] px-4 py-2.5 text-sm text-[var(--text-primary)] transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/30 focus:outline-none"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="subject"
                      className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
                    >
                      Subject
                    </label>
                    <select
                      id="subject"
                      required
                      value={formState.subject}
                      onChange={(e) => setFormState({ ...formState, subject: e.target.value })}
                      className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] px-4 py-2.5 text-sm text-[var(--text-primary)] transition-colors focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/30 focus:outline-none"
                    >
                      <option value="">Select a topic</option>
                      <option value="general">General Inquiry</option>
                      <option value="support">Technical Support</option>
                      <option value="partnership">Partnership</option>
                      <option value="press">Press & Media</option>
                      <option value="feedback">Product Feedback</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="message"
                      className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
                    >
                      Message
                    </label>
                    <textarea
                      id="message"
                      required
                      rows={5}
                      value={formState.message}
                      onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                      className="w-full resize-none rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] px-4 py-2.5 text-sm text-[var(--text-primary)] transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/30 focus:outline-none"
                      placeholder="Tell us what's on your mind..."
                    />
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    className="gradient-conbolo h-12 w-full rounded-xl border-0 text-base font-semibold text-white transition-opacity hover:opacity-90"
                  >
                    Send Message
                    <Send className="ml-2 h-4 w-4" />
                  </Button>
                </form>
              )}
            </div>
          </FadeInSection>
        </div>
      </div>
    </div>
  );
}
