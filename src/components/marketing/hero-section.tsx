"use client";

import { motion } from "framer-motion";
import { ArrowRight, Play, Sparkles, Users, MessagesSquare, Languages, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const socialStats = [
  { icon: Users, value: "10,000+", label: "Learners" },
  { icon: MessagesSquare, value: "500K+", label: "Conversations" },
  { icon: Languages, value: "4", label: "Languages (More Soon)" },
  { icon: Star, value: "4.9/5", label: "Rating" },
];

export function HeroSection() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="hero-gradient-light absolute inset-0" />

      {/* Dot pattern overlay */}
      <div className="dot-pattern absolute inset-0 opacity-20 dark:opacity-10" />

      {/* Gradient orb accents */}
      <div
        className="absolute top-1/4 -left-32 h-[500px] w-[500px] animate-pulse rounded-full bg-[var(--accent-primary)] opacity-[0.12] blur-[100px] dark:opacity-[0.15]"
        style={{ animationDuration: "8s" }}
      />
      <div
        className="absolute -right-32 bottom-1/4 h-[400px] w-[400px] animate-pulse rounded-full bg-[var(--accent-secondary)] opacity-[0.1] blur-[100px] dark:opacity-[0.12]"
        style={{ animationDuration: "10s" }}
      />
      <div className="absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--accent-primary)] opacity-[0.04] blur-[120px] dark:opacity-[0.06]" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-24 pb-16 text-center sm:px-6 sm:pt-32 sm:pb-24 lg:px-8">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <span className="mb-8 inline-flex items-center gap-2 rounded-full border border-[var(--accent-primary)]/30 bg-[var(--accent-light)]/50 px-4 py-1.5 text-xs font-medium text-[var(--accent-primary)] backdrop-blur-sm dark:text-[var(--accent-hover)]">
            <Sparkles className="h-3.5 w-3.5" />
            Now in Public Beta
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-6 text-4xl leading-[1.1] font-extrabold tracking-tight text-[var(--text-primary)] sm:text-5xl md:text-6xl lg:text-7xl"
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
          className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-[var(--text-secondary)] sm:text-xl"
          style={{ fontFamily: "var(--font-body)" }}
        >
          Stop memorizing flashcards. Start having real conversations with an AI tutor that adapts
          to your level, corrects your mistakes, and helps you build confidence — one chat at a
          time.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mb-16 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Button
            size="lg"
            className="gradient-conbolo h-12 rounded-xl border-0 px-8 text-base font-semibold text-white shadow-[var(--shadow-glow)] transition-all hover:opacity-90"
          >
            Start Learning Free
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="h-12 rounded-xl border-[var(--accent-primary)]/30 px-8 text-base font-medium text-[var(--accent-primary)] transition-all hover:border-[var(--accent-primary)]/50 hover:bg-[var(--accent-light)] dark:border-[var(--accent-primary)]/30 dark:text-[var(--accent-hover)] dark:hover:bg-[var(--accent-light)]"
          >
            <Play className="mr-1 h-4 w-4" />
            Watch Demo
          </Button>
        </motion.div>

        {/* Social Proof Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mx-auto grid max-w-3xl grid-cols-2 gap-6 md:grid-cols-4 md:gap-8"
        >
          {socialStats.map((stat, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <stat.icon className="mb-1 h-5 w-5 text-[var(--accent-primary)]" />
              <span
                className="text-xl font-bold text-[var(--text-primary)] sm:text-2xl"
                style={{ fontFamily: "var(--font-heading-cfg)" }}
              >
                {stat.value}
              </span>
              <span className="text-xs text-[var(--text-muted)] sm:text-sm">{stat.label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
