import {
  PrismaClient,
  ProficiencyLevel,
  ScenarioCategory,
  AchievementType,
  AdminRole,
} from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // 1. Supported Languages
  console.log("  → Creating supported languages...");
  await prisma.supportedLanguage.upsert({
    where: { code: "ar" },
    update: {},
    create: {
      code: "ar",
      name: "Arabic",
      nativeName: "العربية",
      direction: "rtl",
      flagEmoji: "🇸🇦",
    },
  });
  await prisma.supportedLanguage.upsert({
    where: { code: "en" },
    update: {},
    create: {
      code: "en",
      name: "English",
      nativeName: "English",
      direction: "ltr",
      flagEmoji: "🇬🇧",
    },
  });
  await prisma.supportedLanguage.upsert({
    where: { code: "es" },
    update: {},
    create: {
      code: "es",
      name: "Spanish",
      nativeName: "Español",
      direction: "ltr",
      flagEmoji: "🇪🇸",
    },
  });
  await prisma.supportedLanguage.upsert({
    where: { code: "fr" },
    update: {},
    create: {
      code: "fr",
      name: "French",
      nativeName: "Français",
      direction: "ltr",
      flagEmoji: "🇫🇷",
    },
  });

  // 2. Super Admin
  console.log("  → Creating super admin...");
  await prisma.admin.upsert({
    where: { email: "admin@convolo.app" },
    update: {},
    create: {
      email: "admin@convolo.app",
      passwordHash: "managed-by-supabase-auth",
      name: "Super Admin",
      role: AdminRole.super_admin,
    },
  });

  // 3. Conversation Scenarios
  console.log("  → Creating conversation scenarios...");
  const scenarios = [
    {
      title: "Ordering at a Restaurant",
      description:
        "Practice ordering food and drinks at a restaurant, asking about menu items, and handling the bill.",
      languagePair: "en-ar",
      category: ScenarioCategory.daily,
      difficultyLevel: ProficiencyLevel.beginner,
      systemPrompt:
        "You are a friendly waiter at a traditional Arabic restaurant. Help the customer order their meal. Speak in Arabic (MSA with some common dialect expressions). If the customer makes a mistake, gently correct them and explain the correct form. Keep the conversation natural and encourage them to try ordering different dishes.",
      openingLine: "أهلاً وسهلاً! تفضل بالجلوس. ماذا تريد أن تطلب؟",
      keyVocabulary: { words: ["طلب", "قائمة", "حساب", "طبق", "مشروب"] },
      culturalNotes:
        "In Arab restaurants, it is common to share dishes. Tea or coffee is often offered after the meal as a sign of hospitality.",
      estimatedMinutes: 10,
      isPremium: false,
      isPublished: true,
      sortOrder: 1,
    },
    {
      title: "At the Airport",
      description:
        "Navigate check-in, security, and boarding at an airport in your target language.",
      languagePair: "en-ar",
      category: ScenarioCategory.travel,
      difficultyLevel: ProficiencyLevel.beginner,
      systemPrompt:
        "You are an airport staff member. Help the traveler check in, go through security, and find their gate. Speak in Arabic. Correct any language mistakes gently and provide useful travel vocabulary.",
      openingLine: "مرحباً! يمكنني مساعدتك؟ هل أنت جاهز لتسجيل الدخول؟",
      keyVocabulary: { words: ["جواز سفر", "تذكرة", "بوابة", "رحلة", "شنطة"] },
      culturalNotes:
        "Arabic airports often have separate family lines. Boarding announcements are typically in Arabic and English.",
      estimatedMinutes: 12,
      isPremium: false,
      isPublished: true,
      sortOrder: 2,
    },
    {
      title: "Business Meeting Introduction",
      description:
        "Introduce yourself and your company in a professional business meeting setting.",
      languagePair: "en-ar",
      category: ScenarioCategory.business,
      difficultyLevel: ProficiencyLevel.intermediate,
      systemPrompt:
        "You are a business professional attending a meeting. Greet your counterpart, exchange pleasantries, and discuss a potential partnership. Speak formal Arabic suitable for business. Correct mistakes and suggest more professional alternatives when appropriate.",
      openingLine: "السلام عليكم، تشرفنا بمعرفتك. أنا مدير الشركة. ما هي الشركة التي تمثلها؟",
      keyVocabulary: { words: ["شراكة", "مشروع", "ميزانية", "عقد", "اجتماع"] },
      culturalNotes:
        "Business meetings in the Arab world often start with extended greetings and personal questions before getting to business.",
      estimatedMinutes: 15,
      isPremium: true,
      isPublished: true,
      sortOrder: 3,
    },
    {
      title: "Coffee Shop Chat",
      description:
        "Casual conversation at a coffee shop with a friend. Practice everyday small talk.",
      languagePair: "en-es",
      category: ScenarioCategory.social,
      difficultyLevel: ProficiencyLevel.beginner,
      systemPrompt:
        "You are a friendly local in a Spanish coffee shop. Chat casually about daily life, work, and hobbies. Speak in Spanish. Correct mistakes naturally in conversation without breaking the flow.",
      openingLine: "¡Hola! ¿Qué tal? ¿Qué te pido? Un café con leche como siempre?",
      keyVocabulary: { words: ["café", "amigo", "trabajo", "fin de semana", "divertido"] },
      estimatedMinutes: 8,
      isPremium: false,
      isPublished: true,
      sortOrder: 4,
    },
    {
      title: "Hotel Check-in",
      description:
        "Check into a hotel, ask about amenities, and resolve a minor issue with your room.",
      languagePair: "en-fr",
      category: ScenarioCategory.travel,
      difficultyLevel: ProficiencyLevel.beginner,
      systemPrompt:
        "You are a hotel receptionist in Paris. Help the guest check in, explain hotel amenities, and assist with a room issue. Speak in French. Correct mistakes gently and provide useful hotel vocabulary.",
      openingLine: "Bonsoir! Bienvenue à notre hôtel. Avez-vous une réservation?",
      keyVocabulary: { words: ["chambre", "clé", "petit-déjeuner", "ascenseur", "réception"] },
      estimatedMinutes: 10,
      isPremium: false,
      isPublished: true,
      sortOrder: 5,
    },
    {
      title: "Doctor Visit",
      description: "Describe your symptoms to a doctor and understand medical instructions.",
      languagePair: "en-ar",
      category: ScenarioCategory.medical,
      difficultyLevel: ProficiencyLevel.intermediate,
      systemPrompt:
        "You are a doctor at a clinic. Ask the patient about their symptoms, provide a diagnosis, and explain the treatment. Speak in Arabic with medical terms explained simply. Correct the patient's language mistakes and teach relevant medical vocabulary.",
      openingLine: "مرحباً، ما الذي يجلبك اليوم؟ هل تشعر بأي أعراض؟",
      keyVocabulary: { words: ["أعراض", "دواء", "وجع", "درجة حرارة", "وصفة"] },
      estimatedMinutes: 12,
      isPremium: true,
      isPublished: true,
      sortOrder: 6,
    },
    {
      title: "Job Interview",
      description: "Practice answering common job interview questions in Spanish.",
      languagePair: "en-es",
      category: ScenarioCategory.business,
      difficultyLevel: ProficiencyLevel.advanced,
      systemPrompt:
        "You are a hiring manager conducting a job interview. Ask about experience, strengths, weaknesses, and career goals. Speak professional Spanish. Correct language errors and suggest more professional phrasing.",
      openingLine:
        "Buenos días. Gracias por venir a esta entrevista. Cuénteme sobre usted y su experiencia profesional.",
      keyVocabulary: { words: ["experiencia", "habilidades", "objetivos", "equipo", "proyecto"] },
      estimatedMinutes: 15,
      isPremium: true,
      isPublished: true,
      sortOrder: 7,
    },
    {
      title: "Free Chat - Daily Life",
      description: "Open conversation about your day, interests, and current events.",
      languagePair: "en-ar",
      category: ScenarioCategory.daily,
      difficultyLevel: ProficiencyLevel.beginner,
      systemPrompt:
        "You are a friendly Arabic speaker having a casual conversation. Ask about the learner's day, share something about yours, and discuss interesting topics. Speak naturally in Arabic. Correct mistakes gently and teach useful expressions.",
      openingLine: "صباح الخير! كيف حالك اليوم؟ هل كان يومك جميلاً؟",
      keyVocabulary: { words: ["يوم", "سعيد", "عمل", "عائلة", "هواية"] },
      estimatedMinutes: 10,
      isPremium: false,
      isPublished: true,
      sortOrder: 8,
    },
  ];

  for (const scenario of scenarios) {
    await prisma.scenario.upsert({
      where: { id: `${scenario.languagePair}-${scenario.sortOrder}` },
      update: {},
      create: { ...scenario, id: `${scenario.languagePair}-${scenario.sortOrder}` },
    });
  }

  console.log("✅ Seeding complete!");
  console.log(`  → 4 languages, 1 admin, ${scenarios.length} scenarios`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
