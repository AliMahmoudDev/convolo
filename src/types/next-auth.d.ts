import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      provider: string;
      nativeLanguage: string;
      targetLanguage: string | null;
      proficiencyLevel: string;
      subscriptionPlan: string;
      subscriptionStatus: string;
    } & DefaultSession["user"];
  }

  interface User {
    provider?: string;
    nativeLanguage?: string;
    targetLanguage?: string | null;
    proficiencyLevel?: string;
    subscriptionPlan?: string;
    subscriptionStatus?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    provider: string;
    nativeLanguage: string;
    targetLanguage: string | null;
    proficiencyLevel: string;
    subscriptionPlan: string;
    subscriptionStatus: string;
  }
}
