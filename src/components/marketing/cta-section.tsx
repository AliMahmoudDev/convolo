import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FadeInSection } from "@/components/marketing/fade-in-section";

export function CTASection() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      {/* Gradient background */}
      <div className="gradient-conbolo absolute inset-0" />

      {/* Decorative elements */}
      <div className="dot-pattern absolute inset-0 opacity-10" />
      <div className="absolute top-0 left-1/4 h-72 w-72 rounded-full bg-white opacity-5 blur-[100px]" />
      <div className="absolute right-1/4 bottom-0 h-72 w-72 rounded-full bg-white opacity-5 blur-[100px]" />

      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <FadeInSection>
          <h2
            className="mb-5 text-3xl font-bold text-white sm:text-4xl md:text-5xl"
            style={{ fontFamily: "var(--font-heading-cfg)" }}
          >
            Ready to Start Speaking?
          </h2>
          <p className="mx-auto mb-10 max-w-xl text-lg text-white/80 sm:text-xl">
            Join thousands of learners building fluency through real practice.
          </p>
          <Button
            size="lg"
            className="h-14 rounded-xl bg-white px-10 text-base font-bold text-[var(--accent-primary)] shadow-lg transition-all hover:bg-white/90 hover:shadow-xl"
          >
            Start Your Free Account
            <ArrowRight className="ml-1 h-5 w-5" />
          </Button>
        </FadeInSection>
      </div>
    </section>
  );
}
