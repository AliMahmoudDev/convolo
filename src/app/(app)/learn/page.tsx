/**
 * /learn — Practice Page (Scenario Selection + Start Conversation)
 *
 * LANGUAGE SWITCHING PATTERN (Duolingo-style):
 * ────────────────────────────────────────────
 * - This page is DISPLAY-ONLY for language settings
 * - To change languages → go to Dashboard (Language Card)
 * - To change level → go to Dashboard (Language Card)
 * - The language bar here just shows the current pair + a "Change" link
 *
 * WHY: No more scattered language switchers! One place = Dashboard.
 *
 * Features:
 * 1. Language pair display (read-only from profile store)
 * 2. Free Chat + Scenario cards (fetched from API, filtered by language pair)
 * 3. Category filter tabs (including academic)
 * 4. Difficulty filter
 * 5. Dynamic opening lines per language
 * 6. Start conversation → POST /api/conversations → redirect to /learn/[id]
 */

"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  MessageSquare,
  ArrowRight,
  Sparkles,
  Loader2,
  AlertCircle,
  Settings2,
  Crown,
  Clock,
  BookOpen,
  Lightbulb,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SUPPORTED_LANGUAGES, type ProficiencyLevel } from "@/lib/constants";
import { useProfileStore, useTargetLanguage, useNativeLanguage } from "@/stores/profile-store";

// ═══════════════════════════════════════════
// Types
// ═══════════════════════════════════════════

interface Scenario {
  id: string;
  title: string;
  description: string;
  category: string;
  difficultyLevel: string;
  languagePair?: string;
  targetLanguage?: string;
  openingLine: string;
  keyVocabulary?: string[];
  culturalNotes?: string;
  estimatedMinutes?: number;
  systemPrompt?: string;
  isPremium: boolean;
  isLocked?: boolean;
}

// ═══════════════════════════════════════════
// Dynamic opening lines per language
// ═══════════════════════════════════════════

const OPENING_LINES: Record<string, Record<string, string>> = {
  daily: {
    en: "Hello! How can I help you today?",
    ar: "أهلاً وسهلاً! تفضل بالجلوس. ماذا تريد أن تطلب؟",
    es: "¡Hola! ¿En qué puedo ayudarte hoy?",
    fr: "Bonjour ! Comment puis-je vous aider aujourd'hui ?",
    de: "Hallo! Wie kann ich Ihnen heute helfen?",
    ja: "いらっしゃいませ！今日はどうされますか？",
    ko: "안녕하세요! 오늘 어떻게 도와드릴까요?",
    zh: "你好！今天我能帮你什么？",
    pt: "Olá! Como posso ajudar você hoje?",
    it: "Ciao! Come posso aiutarti oggi?",
    ru: "Здравствуйте! Чем могу помочь сегодня?",
    hi: "नमस्ते! आज मैं आपकी कैसे मदद कर सकता हूँ?",
    tr: "Merhaba! Bugün size nasıl yardımcı olabilirim?",
  },
  travel: {
    en: "Welcome! Are you ready to check in?",
    ar: "مرحباً! يمكنني مساعدتك؟ هل أنت جاهز لتسجيل الدخول؟",
    es: "¡Bienvenido! ¿Está listo para registrarse?",
    fr: "Bienvenue ! Êtes-vous prêt pour l'enregistrement ?",
    de: "Willkommen! Sind Sie bereit zum Einchecken?",
    ja: "ようこそ！チェックインの準備はよろしいですか？",
    ko: "환영합니다! 체크인 준비 되셨나요?",
    zh: "欢迎！您准备好入住登记了吗？",
    pt: "Bem-vindo! Está pronto para fazer o check-in?",
    it: "Benvenuto! È pronto per il check-in?",
    ru: "Добро пожаловать! Вы готовы к регистрации?",
    hi: "स्वागत है! क्या आप चेक-इन के लिए तैयार हैं?",
    tr: "Hoş geldiniz! Giriş için hazır mısınız?",
  },
  social: {
    en: "Hey! Long time no see. How have you been?",
    ar: "أهلاً! زمان شكرك. كيف حالك؟",
    es: "¡Hola! Cuánto tiempo sin verte. ¿Cómo has estado?",
    fr: "Salut ! Ça fait longtemps. Comment vas-tu ?",
    de: "Hey! Lange nicht gesehen. Wie geht es dir?",
    ja: "やあ！久しぶり。元気にしてた？",
    ko: "안녕! 오랜만이야. 잘 지냈어?",
    zh: "嘿！好久不见。你最近怎么样？",
    pt: "Oi! Há quanto tempo! Como você tem estado?",
    it: "Ciao! Da quanto tempo! Come stai?",
    ru: "Привет! Давно не виделись. Как дела?",
    hi: "अरे! बहुत दिनों बाद मिले। कैसे हो?",
    tr: "Hey! Görüşmeyeli nasılsın?",
  },
  business: {
    en: "Good morning. Shall we get started with the meeting?",
    ar: "صباح الخير. هل نبدأ الاجتماع؟",
    es: "Buenos días. ¿Empezamos la reunión?",
    fr: "Bonjour. Devons-nous commencer la réunion ?",
    de: "Guten Morgen. Sollen wir mit dem Meeting beginnen?",
    ja: "おはようございます。会議を始めましょうか？",
    ko: "좋은 아침입니다. 회의를 시작할까요?",
    zh: "早上好。我们开始开会吧？",
    pt: "Bom dia. Vamos começar a reunião?",
    it: "Buongiorno. Iniziamo la riunione?",
    ru: "Доброе утро. Начнём встречу?",
    hi: "सुप्रभात। क्या हम बैठक शुरू करें?",
    tr: "Günaydın. Toplantıya başlayalım mı?",
  },
  medical: {
    en: "Hello, what brings you in today?",
    ar: "مرحباً، ما الذي يجلبك اليوم؟",
    es: "Hola, ¿qué la trae hoy?",
    fr: "Bonjour, qu'est-ce qui vous amène aujourd'hui ?",
    de: "Hallo, was führt Sie heute hierher?",
    ja: "こんにちは、今日はどうされましたか？",
    ko: "안녕하세요, 오늘 어떻게 오셨나요?",
    zh: "你好，今天来看什么？",
    pt: "Olá, o que a traz aqui hoje?",
    it: "Ciao, cosa ti porta qui oggi?",
    ru: "Здравствуйте, что привело вас сегодня?",
    hi: "नमस्ते, आज आप क्यों आए हैं?",
    tr: "Merhaba, sizi bugün buraya getiren nedir?",
  },
  academic: {
    en: "Welcome to class! Today we'll explore an interesting topic.",
    ar: "أهلاً بك في الحصة! اليوم سنستكشف موضوعاً مثيراً.",
    es: "¡Bienvenido a clase! Hoy exploraremos un tema interesante.",
    fr: "Bienvenue en classe ! Aujourd'hui, nous allons explorer un sujet intéressant.",
    de: "Willkommen im Unterricht! Heute werden wir ein interessantes Thema erkunden.",
    ja: "授業へようこそ！今日は面白いトピックを探ります。",
    ko: "수업에 오신 것을 환영합니다! 오늘은 흥미로운 주제를 탐구하겠습니다.",
    zh: "欢迎来上课！今天我们将探索一个有趣的话题。",
    pt: "Bem-vindo à aula! Hoje vamos explorar um tópico interessante.",
    it: "Benvenuto in classe! Oggi esploreremo un argomento interessante.",
    ru: "Добро пожаловать на занятие! Сегодня мы рассмотрим интересную тему.",
    hi: "कक्षा में आपका स्वागत है! आज हम एक दिलचस्प विषय का पता लगाएंगे।",
    tr: "Derse hoş geldiniz! Bugün ilginç bir konuyu keşfedeceğiz.",
  },
};

function getOpeningLine(category: string, targetLang: string): string {
  const categoryLines = OPENING_LINES[category] || OPENING_LINES.daily;
  return categoryLines[targetLang] || categoryLines.en || "Hello! Let's start practicing.";
}

// ═══════════════════════════════════════════
// Dynamic fallback scenario templates
// ═══════════════════════════════════════════

interface ScenarioTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  difficultyLevel: string;
  isPremium: boolean;
}

const SCENARIO_TEMPLATES: ScenarioTemplate[] = [
  {
    id: "fb-daily-1",
    title: "Ordering at a Restaurant",
    description:
      "Practice ordering food and drinks at a restaurant, asking about menu items, and handling the bill.",
    category: "daily",
    difficultyLevel: "beginner",
    isPremium: false,
  },
  {
    id: "fb-travel-1",
    title: "At the Airport",
    description: "Navigate check-in, security, and boarding at an airport in your target language.",
    category: "travel",
    difficultyLevel: "beginner",
    isPremium: false,
  },
  {
    id: "fb-social-1",
    title: "Coffee Shop Chat",
    description:
      "Casual conversation at a coffee shop with a friend. Practice everyday small talk.",
    category: "social",
    difficultyLevel: "beginner",
    isPremium: false,
  },
  {
    id: "fb-travel-2",
    title: "Hotel Check-in",
    description:
      "Check into a hotel, ask about amenities, and resolve a minor issue with your room.",
    category: "travel",
    difficultyLevel: "beginner",
    isPremium: false,
  },
  {
    id: "fb-business-1",
    title: "Business Meeting",
    description: "Introduce yourself and your company in a professional business meeting.",
    category: "business",
    difficultyLevel: "intermediate",
    isPremium: true,
  },
  {
    id: "fb-medical-1",
    title: "Doctor Visit",
    description: "Describe your symptoms to a doctor and understand medical instructions.",
    category: "medical",
    difficultyLevel: "intermediate",
    isPremium: true,
  },
  {
    id: "fb-academic-1",
    title: "University Lecture Discussion",
    description: "Discuss a lecture topic with a classmate, share opinions, and debate ideas.",
    category: "academic",
    difficultyLevel: "intermediate",
    isPremium: false,
  },
  {
    id: "fb-daily-2",
    title: "Grocery Shopping",
    description:
      "Go grocery shopping, ask about products, compare prices, and complete your purchase.",
    category: "daily",
    difficultyLevel: "beginner",
    isPremium: false,
  },
];

function buildDynamicScenarios(targetLangCode: string): Scenario[] {
  return SCENARIO_TEMPLATES.map((tpl) => ({
    ...tpl,
    languagePair: undefined,
    targetLanguage: targetLangCode,
    openingLine: getOpeningLine(tpl.category, targetLangCode),
    isLocked: tpl.isPremium,
  }));
}

// ═══════════════════════════════════════════
// Category definitions (includes academic)
// ═══════════════════════════════════════════

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "daily", label: "Daily" },
  { id: "travel", label: "Travel" },
  { id: "social", label: "Social" },
  { id: "business", label: "Business" },
  { id: "academic", label: "Academic" },
  { id: "medical", label: "Medical" },
] as const;

type CategoryId = (typeof CATEGORIES)[number]["id"];

// ═══════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════

export default function LearnPage() {
  const router = useRouter();

  // Profile from shared store — single source of truth
  const profile = useProfileStore((s) => s.profile);
  const fetchProfile = useProfileStore((s) => s.fetchProfile);
  const isProfileInitialized = useProfileStore((s) => s.isInitialized);
  const targetLang = useTargetLanguage();
  const nativeLang = useNativeLanguage();

  // Local state — derived from profile store (read-only here!)
  const nativeLangCode = profile?.nativeLanguage || "en";
  const targetLangCode = profile?.targetLanguage || "ar";
  const difficulty: ProficiencyLevel = profile?.proficiencyLevel || "beginner";

  // Scenario + filter state
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [activeCategory, setActiveCategory] = useState<CategoryId>("all");
  const [activeDifficulty, setActiveDifficulty] = useState<string>("all");
  const [isLoadingScenarios, setIsLoadingScenarios] = useState(true);

  // Loading + error states
  const [isStarting, setIsStarting] = useState(false);
  const [startingScenarioId, setStartingScenarioId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ─── Fetch profile on mount ───
  useEffect(() => {
    if (!isProfileInitialized) {
      fetchProfile();
    }
  }, [isProfileInitialized, fetchProfile]);

  // ─── Fetch scenarios from API (filtered by language pair) ───
  const fetchScenariosFromAPI = useCallback(async () => {
    setIsLoadingScenarios(true);
    try {
      const languagePair = `${nativeLangCode}-${targetLangCode}`;
      const params = new URLSearchParams({ languagePair });
      if (activeDifficulty !== "all") {
        params.set("difficultyLevel", activeDifficulty);
      }

      const res = await fetch(`/api/scenarios?${params}`);
      const data = await res.json();

      if (data.success && data.data?.scenarios && data.data.scenarios.length > 0) {
        const mapped: Scenario[] = data.data.scenarios.map(
          (s: {
            id: string;
            title: string;
            description: string;
            category: string;
            difficultyLevel: string;
            languagePair?: string;
            openingLine: string;
            keyVocabulary?: string[];
            culturalNotes?: string;
            estimatedMinutes?: number;
            systemPrompt?: string;
            isPremium: boolean;
            isLocked?: boolean;
          }) => ({
            id: s.id,
            title: s.title,
            description: s.description,
            category: s.category,
            difficultyLevel: s.difficultyLevel,
            languagePair: s.languagePair,
            targetLanguage: s.languagePair?.split("-")[1] || targetLangCode,
            openingLine: s.openingLine,
            keyVocabulary: s.keyVocabulary,
            culturalNotes: s.culturalNotes,
            estimatedMinutes: s.estimatedMinutes,
            systemPrompt: s.systemPrompt,
            isPremium: s.isPremium,
            isLocked: s.isLocked,
          })
        );

        // Also filter by difficulty client-side if needed
        if (activeDifficulty !== "all") {
          const filtered = mapped.filter((s) => s.difficultyLevel === activeDifficulty);
          setScenarios(filtered.length > 0 ? filtered : mapped);
        } else {
          setScenarios(mapped);
        }
      } else {
        // No DB scenarios for this language pair → use dynamic fallbacks
        const dynamicFallbacks = buildDynamicScenarios(targetLangCode);
        if (activeDifficulty !== "all") {
          const filtered = dynamicFallbacks.filter((s) => s.difficultyLevel === activeDifficulty);
          setScenarios(filtered.length > 0 ? filtered : dynamicFallbacks);
        } else {
          setScenarios(dynamicFallbacks);
        }
      }
    } catch {
      // API error → use dynamic fallbacks
      const dynamicFallbacks = buildDynamicScenarios(targetLangCode);
      if (activeDifficulty !== "all") {
        const filtered = dynamicFallbacks.filter((s) => s.difficultyLevel === activeDifficulty);
        setScenarios(filtered.length > 0 ? filtered : dynamicFallbacks);
      } else {
        setScenarios(dynamicFallbacks);
      }
    } finally {
      setIsLoadingScenarios(false);
    }
  }, [nativeLangCode, targetLangCode, activeDifficulty]);

  useEffect(() => {
    fetchScenariosFromAPI();
  }, [fetchScenariosFromAPI]);

  // ─── Filtered scenarios by category + difficulty ───
  const filteredScenarios = useMemo(() => {
    let result = scenarios;
    if (activeCategory !== "all") {
      result = result.filter((s) => s.category === activeCategory);
    }
    if (activeDifficulty !== "all") {
      result = result.filter((s) => s.difficultyLevel === activeDifficulty);
    }
    return result;
  }, [scenarios, activeCategory, activeDifficulty]);

  // ─── Start a conversation ───
  const startConversation = async (
    scenarioTargetLang?: string,
    scenarioDifficulty?: ProficiencyLevel,
    scenarioId?: string
  ) => {
    setIsStarting(true);
    setError(null);
    setStartingScenarioId(scenarioId || scenarioTargetLang || "free");

    const effectiveTarget = scenarioTargetLang || targetLangCode;
    const effectiveDifficulty = scenarioDifficulty || difficulty;
    const languagePair = `${nativeLangCode}-${effectiveTarget}`;

    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          languagePair,
          difficultyLevel: effectiveDifficulty,
          scenarioId: scenarioId || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to start conversation");
      }

      router.push(`/learn/${data.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start conversation");
    } finally {
      setIsStarting(false);
      setStartingScenarioId(null);
    }
  };

  // ─── Loading state ───
  if (!isProfileInitialized) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--accent-primary)]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <h1
          className="mb-2 text-2xl font-bold text-[var(--text-primary)] sm:text-3xl"
          style={{ fontFamily: "var(--font-heading-cfg)" }}
        >
          Practice Conversations
        </h1>
        <p className="text-[var(--text-secondary)]">
          Choose a scenario or start a free chat with your AI tutor
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-xl bg-[var(--state-error-light)] px-4 py-3 text-sm text-[var(--state-error)]">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ═══ Language bar — DISPLAY ONLY ═══ */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)]">
        <div className="flex flex-wrap items-center gap-2 p-4 sm:gap-3">
          {/* Native language badge */}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--bg-elevated)] px-3 py-1.5 text-sm font-medium text-[var(--text-primary)]">
            <span className="text-base">{nativeLang.flagEmoji}</span>
            {nativeLang.name}
          </span>

          <span className="text-[var(--text-muted)]">&rarr;</span>

          {/* Target language badge */}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent-light)] px-3 py-1.5 text-sm font-medium text-[var(--accent-primary)]">
            <span className="text-base">{targetLang.flagEmoji}</span>
            {targetLang.name}
          </span>

          {/* Level badge */}
          <span className="inline-flex items-center rounded-full bg-[var(--bg-elevated)] px-3 py-1.5 text-sm text-[var(--text-secondary)] capitalize">
            {difficulty}
          </span>

          {/* Spacer to push Change button to end on wrapped rows */}
          <div className="flex-1" />

          {/* Change link → goes to Dashboard */}
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent-light)] px-3 py-2 text-xs font-semibold text-[var(--accent-primary)] transition-colors hover:bg-[var(--accent-primary)] hover:text-white"
          >
            <Settings2 className="h-3.5 w-3.5" />
            Change
          </Link>
        </div>
      </div>

      {/* Free Chat CTA — dynamic with language */}
      <div className="gradient-conbolo relative mb-8 overflow-hidden rounded-2xl p-6 text-white">
        <div className="dot-pattern absolute inset-0 opacity-10" />
        <div className="relative z-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              <h2
                className="text-lg font-semibold"
                style={{ fontFamily: "var(--font-heading-cfg)" }}
              >
                Free Chat
              </h2>
            </div>
            <p className="text-sm text-white/70">
              Talk about anything with your AI tutor. No script, just natural conversation.
            </p>
            <p className="mt-1 text-xs text-white/50">
              {nativeLang.name} &rarr; {targetLang.name} &middot;{" "}
              {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
            </p>
            {/* Dynamic preview opening in target language */}
            <p className="mt-2 text-xs text-white/60 italic">
              &ldquo;{getOpeningLine("daily", targetLangCode)}&rdquo;
            </p>
          </div>
          <Button
            onClick={() => startConversation()}
            disabled={isStarting}
            className="h-11 shrink-0 rounded-xl bg-white px-6 text-sm font-semibold text-[var(--accent-primary)] hover:bg-white/90 disabled:opacity-50"
          >
            {isStarting && startingScenarioId === "free" ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <MessageSquare className="mr-1.5 h-4 w-4" />
            )}
            Start Free Chat
          </Button>
        </div>
      </div>

      {/* ═══ Filter Tabs: Category + Difficulty ═══ */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Category tabs */}
        <div className="custom-scrollbar flex flex-1 items-center gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
                activeCategory === cat.id
                  ? "bg-[var(--accent-primary)] text-white shadow-sm"
                  : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--accent-light)] hover:text-[var(--accent-primary)]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Difficulty filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-[var(--text-muted)]" />
          <select
            value={activeDifficulty}
            onChange={(e) => setActiveDifficulty(e.target.value)}
            className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs text-[var(--text-secondary)] outline-none focus:border-[var(--accent-primary)]"
          >
            <option value="all">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
      </div>

      {/* ═══ Scenario Grid ═══ */}
      <div className="mb-4 flex items-center justify-between">
        <h2
          className="text-lg font-semibold text-[var(--text-primary)]"
          style={{ fontFamily: "var(--font-heading-cfg)" }}
        >
          Conversation Scenarios
        </h2>
        {!isLoadingScenarios && (
          <span className="text-xs text-[var(--text-muted)]">
            {filteredScenarios.length} {filteredScenarios.length === 1 ? "scenario" : "scenarios"}
          </span>
        )}
      </div>

      {isLoadingScenarios ? (
        /* Loading skeleton for scenario cards */
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5"
            >
              <div className="mb-3 flex items-center gap-2">
                <div className="h-5 w-14 rounded-full bg-[var(--bg-elevated)]" />
                <div className="h-5 w-20 rounded-full bg-[var(--bg-elevated)]" />
              </div>
              <div className="mb-2 h-4 w-3/4 rounded bg-[var(--bg-elevated)]" />
              <div className="mb-4 h-3 w-full rounded bg-[var(--bg-elevated)]" />
              <div className="h-8 w-full rounded-lg bg-[var(--bg-elevated)]" />
            </div>
          ))}
        </div>
      ) : filteredScenarios.length === 0 ? (
        /* Empty state for category filter */
        <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-8 text-center">
          <MessageSquare className="mx-auto mb-3 h-10 w-10 text-[var(--text-muted)]" />
          <h3
            className="mb-1 text-sm font-semibold text-[var(--text-primary)]"
            style={{ fontFamily: "var(--font-heading-cfg)" }}
          >
            No scenarios in this category
          </h3>
          <p className="text-xs text-[var(--text-muted)]">
            Try selecting a different category or difficulty, or start a free chat instead.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredScenarios.map((scenario) => {
            const isPremium = (scenario.isPremium || scenario.isLocked) && !profile?.isPro;
            const isStartingThis = isStarting && startingScenarioId === scenario.id;
            const vocabCount = Array.isArray(scenario.keyVocabulary)
              ? scenario.keyVocabulary.length
              : 0;

            return (
              <div
                key={scenario.id}
                className="group rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--accent-primary)]/30 hover:shadow-[var(--shadow-md)]"
              >
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-[var(--accent-light)] px-2.5 py-0.5 text-[10px] font-medium text-[var(--accent-primary)]">
                    {scenario.category.charAt(0).toUpperCase() + scenario.category.slice(1)}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-[var(--bg-elevated)] px-2.5 py-0.5 text-[10px] font-medium text-[var(--text-secondary)]">
                    {scenario.difficultyLevel.charAt(0).toUpperCase() +
                      scenario.difficultyLevel.slice(1)}
                  </span>
                  {(scenario.isPremium || scenario.isLocked) && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-[var(--color-gold-light)] px-2.5 py-0.5 text-[10px] font-medium text-[var(--color-gold)]">
                      <Crown className="h-2.5 w-2.5" />
                      Pro
                    </span>
                  )}
                </div>
                <h3
                  className="mb-2 text-base font-semibold text-[var(--text-primary)]"
                  style={{ fontFamily: "var(--font-heading-cfg)" }}
                >
                  {scenario.title}
                </h3>
                <p className="mb-3 text-xs leading-relaxed text-[var(--text-secondary)]">
                  {scenario.description}
                </p>

                {/* Enrichment data: estimated time, vocabulary count, cultural notes */}
                {(scenario.estimatedMinutes || vocabCount > 0 || scenario.culturalNotes) && (
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    {scenario.estimatedMinutes && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--bg-elevated)] px-2 py-0.5 text-[10px] text-[var(--text-muted)]">
                        <Clock className="h-2.5 w-2.5" />~{scenario.estimatedMinutes} min
                      </span>
                    )}
                    {vocabCount > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--bg-elevated)] px-2 py-0.5 text-[10px] text-[var(--text-muted)]">
                        <BookOpen className="h-2.5 w-2.5" />
                        {vocabCount} vocab
                      </span>
                    )}
                    {scenario.culturalNotes && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--bg-elevated)] px-2 py-0.5 text-[10px] text-[var(--text-muted)]">
                        <Lightbulb className="h-2.5 w-2.5" />
                        Cultural tip
                      </span>
                    )}
                  </div>
                )}

                {scenario.openingLine && (
                  <div className="mb-3 text-xs text-[var(--text-muted)] italic">
                    &ldquo;{scenario.openingLine}&rdquo;
                  </div>
                )}
                <Button
                  size="sm"
                  onClick={() =>
                    isPremium
                      ? router.push("/pricing")
                      : startConversation(
                          scenario.targetLanguage,
                          scenario.difficultyLevel as ProficiencyLevel,
                          scenario.id
                        )
                  }
                  disabled={isStartingThis}
                  className={`h-9 w-full rounded-lg text-xs ${
                    isPremium
                      ? "border border-[var(--accent-primary)]/30 bg-transparent text-[var(--accent-primary)] hover:bg-[var(--accent-light)]"
                      : "gradient-conbolo border-0 text-white hover:opacity-90"
                  }`}
                >
                  {isStartingThis ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  )}
                  {isPremium ? "Upgrade to Pro" : "Start Conversation"}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
