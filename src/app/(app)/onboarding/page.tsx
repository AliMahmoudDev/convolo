"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2, Sparkles, BookOpen, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProfileStore } from "@/stores/profile-store";
import { useAuthStore } from "@/stores/auth-store";
import { SUPPORTED_LANGUAGES, PROFICIENCY_LEVELS, type ProficiencyLevel } from "@/lib/constants";

// ═══════════════════════════════════════════
// Types
// ═══════════════════════════════════════════

type OnboardingStep = 1 | 2 | 3;

interface StepConfig {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}

// ═══════════════════════════════════════════
// Step Configuration
// ═══════════════════════════════════════════

const STEPS: Record<OnboardingStep, StepConfig> = {
  1: {
    title: "What's your native language?",
    subtitle: "We'll use this to personalize your learning experience",
    icon: <BookOpen className="h-5 w-5" />,
  },
  2: {
    title: "What language do you want to learn?",
    subtitle: "Choose your target language to get started",
    icon: <Sparkles className="h-5 w-5" />,
  },
  3: {
    title: "What's your level?",
    subtitle: "This helps us tailor conversations to your skill",
    icon: <Trophy className="h-5 w-5" />,
  },
};

const PROFICIENCY_META: Record<
  ProficiencyLevel,
  { label: string; description: string; emoji: string }
> = {
  beginner: {
    label: "Beginner",
    description: "I'm just starting out",
    emoji: "🌱",
  },
  intermediate: {
    label: "Intermediate",
    description: "I know the basics",
    emoji: "📚",
  },
  advanced: {
    label: "Advanced",
    description: "I want to master it",
    emoji: "🏆",
  },
};

// ═══════════════════════════════════════════
// Onboarding Page
// ═══════════════════════════════════════════

export default function OnboardingPage() {
  const router = useRouter();
  const profile = useProfileStore((s) => s.profile);
  const fetchProfile = useProfileStore((s) => s.fetchProfile);
  const updateProfile = useProfileStore((s) => s.updateProfile);
  const isInitialized = useProfileStore((s) => s.isInitialized);
  const user = useAuthStore((s) => s.user);

  const [currentStep, setCurrentStep] = useState<OnboardingStep>(1);
  const [nativeLanguage, setNativeLanguage] = useState<string | null>(null);
  const [targetLanguage, setTargetLanguage] = useState<string | null>(null);
  const [proficiencyLevel, setProficiencyLevel] = useState<ProficiencyLevel | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [isAnimating, setIsAnimating] = useState(false);

  // Fetch profile on mount if not initialized
  useEffect(() => {
    if (!isInitialized) {
      fetchProfile();
    }
  }, [isInitialized, fetchProfile]);

  // Pre-fill from profile if available
  useEffect(() => {
    if (profile) {
      if (profile.nativeLanguage) setNativeLanguage(profile.nativeLanguage);
      if (profile.targetLanguage) setTargetLanguage(profile.targetLanguage);
      if (profile.proficiencyLevel) setProficiencyLevel(profile.proficiencyLevel);

      // If onboarding already completed, redirect to dashboard
      if (profile.onboardingCompleted) {
        router.replace("/dashboard");
      }
    }
  }, [profile, router]);

  // If not authenticated, redirect to login
  useEffect(() => {
    if (useAuthStore.getState().isInitialized && !user) {
      router.replace("/login");
    }
  }, [user, router]);

  const triggerAnimation = useCallback((cb: () => void) => {
    setIsAnimating(true);
    setTimeout(() => {
      cb();
      setIsAnimating(false);
    }, 200);
  }, []);

  const goNext = useCallback(() => {
    if (currentStep < 3) {
      setDirection("forward");
      triggerAnimation(() => setCurrentStep((s) => (s + 1) as OnboardingStep));
    }
  }, [currentStep, triggerAnimation]);

  const goBack = useCallback(() => {
    if (currentStep > 1) {
      setDirection("back");
      triggerAnimation(() => setCurrentStep((s) => (s - 1) as OnboardingStep));
    }
  }, [currentStep, triggerAnimation]);

  const handleComplete = useCallback(async () => {
    if (!nativeLanguage || !targetLanguage || !proficiencyLevel) return;

    setIsSaving(true);
    try {
      await updateProfile({
        nativeLanguage,
        targetLanguage,
        proficiencyLevel,
      });
      router.replace("/dashboard");
    } catch (error) {
      console.error("[Onboarding] Failed to save profile:", error);
    } finally {
      setIsSaving(false);
    }
  }, [nativeLanguage, targetLanguage, proficiencyLevel, updateProfile, router]);

  const canContinue =
    (currentStep === 1 && nativeLanguage !== null) ||
    (currentStep === 2 && targetLanguage !== null) ||
    (currentStep === 3 && proficiencyLevel !== null);

  const isLastStep = currentStep === 3;

  // Filtered languages for step 2 (exclude native)
  const targetLanguages = SUPPORTED_LANGUAGES.filter((l) => l.code !== nativeLanguage);

  return (
    <div className="hero-gradient-light dark:hero-gradient-dark fixed inset-0 z-50 flex flex-col">
      {/* Header with step indicator */}
      <header className="flex flex-col items-center px-6 pt-8 pb-4">
        {/* Logo */}
        <div className="mb-8 flex items-center gap-2">
          <span className="gradient-conbolo-text text-2xl font-bold tracking-tight">Convolo</span>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-3">
          {([1, 2, 3] as OnboardingStep[]).map((step) => (
            <div key={step} className="flex items-center gap-3">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-all duration-300 ${
                  step === currentStep
                    ? "bg-[var(--accent-primary)] text-white shadow-[var(--shadow-glow)]"
                    : step < currentStep
                      ? "bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]"
                      : "bg-[var(--bg-elevated)] text-[var(--text-muted)]"
                }`}
              >
                {step < currentStep ? "✓" : step}
              </div>
              {step < 3 && (
                <div
                  className={`h-0.5 w-8 rounded-full transition-all duration-300 sm:w-12 ${
                    step < currentStep ? "bg-[var(--accent-primary)]" : "bg-[var(--border-default)]"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step title */}
        <div className="mt-6 text-center">
          <div className="mb-2 flex items-center justify-center gap-2 text-[var(--accent-primary)]">
            {STEPS[currentStep].icon}
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
            {STEPS[currentStep].title}
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)] sm:text-base">
            {STEPS[currentStep].subtitle}
          </p>
        </div>
      </header>

      {/* Content area with animated transitions */}
      <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <div
            className={`transition-all duration-200 ${
              isAnimating
                ? direction === "forward"
                  ? "translate-x-8 opacity-0"
                  : "-translate-x-8 opacity-0"
                : "translate-x-0 opacity-100"
            }`}
          >
            {/* Step 1: Native Language */}
            {currentStep === 1 && (
              <LanguageGrid
                languages={SUPPORTED_LANGUAGES}
                selected={nativeLanguage}
                onSelect={setNativeLanguage}
              />
            )}

            {/* Step 2: Target Language */}
            {currentStep === 2 && (
              <LanguageGrid
                languages={targetLanguages}
                selected={targetLanguage}
                onSelect={setTargetLanguage}
              />
            )}

            {/* Step 3: Proficiency Level */}
            {currentStep === 3 && (
              <ProficiencyGrid selected={proficiencyLevel} onSelect={setProficiencyLevel} />
            )}
          </div>
        </div>
      </main>

      {/* Footer with navigation buttons */}
      <footer className="border-t border-[var(--border-default)] bg-[var(--bg-surface)]/80 px-6 py-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          {currentStep > 1 ? (
            <Button
              variant="ghost"
              onClick={goBack}
              disabled={isSaving}
              className="gap-2 text-[var(--text-secondary)]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          ) : (
            <div />
          )}

          <Button
            onClick={isLastStep ? handleComplete : goNext}
            disabled={!canContinue || isSaving}
            className="gap-2 bg-[var(--accent-primary)] px-8 text-white hover:bg-[var(--accent-hover)]"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : isLastStep ? (
              <>
                Start Learning
                <Sparkles className="h-4 w-4" />
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </footer>
    </div>
  );
}

// ═══════════════════════════════════════════
// Language Grid Component
// ═══════════════════════════════════════════

function LanguageGrid({
  languages,
  selected,
  onSelect,
}: {
  languages: readonly (typeof SUPPORTED_LANGUAGES)[number][];
  selected: string | null;
  onSelect: (code: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {languages.map((lang) => {
        const isSelected = selected === lang.code;
        return (
          <button
            key={lang.code}
            onClick={() => onSelect(lang.code)}
            className={`group flex flex-col items-center gap-2 rounded-xl border-2 px-4 py-5 transition-all duration-200 ${
              isSelected
                ? "border-[var(--accent-primary)] bg-[var(--accent-light)] shadow-[var(--shadow-glow)]"
                : "border-[var(--border-default)] bg-[var(--bg-surface)] hover:border-[var(--accent-primary)]/40 hover:bg-[var(--bg-elevated)] hover:shadow-[var(--shadow-md)]"
            }`}
            type="button"
          >
            <span className="text-4xl transition-transform duration-200 group-hover:scale-110">
              {lang.flagEmoji}
            </span>
            <span
              className={`text-sm font-semibold ${
                isSelected ? "text-[var(--accent-primary)]" : "text-[var(--text-primary)]"
              }`}
            >
              {lang.name}
            </span>
            <span className="text-xs text-[var(--text-muted)]">{lang.nativeName}</span>
          </button>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════
// Proficiency Grid Component
// ═══════════════════════════════════════════

function ProficiencyGrid({
  selected,
  onSelect,
}: {
  selected: ProficiencyLevel | null;
  onSelect: (level: ProficiencyLevel) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {PROFICIENCY_LEVELS.map((level) => {
        const meta = PROFICIENCY_META[level];
        const isSelected = selected === level;
        return (
          <button
            key={level}
            onClick={() => onSelect(level)}
            className={`group flex flex-col items-center gap-3 rounded-xl border-2 px-6 py-8 transition-all duration-200 ${
              isSelected
                ? "border-[var(--accent-primary)] bg-[var(--accent-light)] shadow-[var(--shadow-glow)]"
                : "border-[var(--border-default)] bg-[var(--bg-surface)] hover:border-[var(--accent-primary)]/40 hover:bg-[var(--bg-elevated)] hover:shadow-[var(--shadow-md)]"
            }`}
            type="button"
          >
            <span className="text-5xl transition-transform duration-200 group-hover:scale-110">
              {meta.emoji}
            </span>
            <span
              className={`text-lg font-bold ${
                isSelected ? "text-[var(--accent-primary)]" : "text-[var(--text-primary)]"
              }`}
            >
              {meta.label}
            </span>
            <span className="text-sm text-[var(--text-muted)]">{meta.description}</span>
          </button>
        );
      })}
    </div>
  );
}
