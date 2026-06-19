import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(db),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.hashedPassword) {
          return null;
        }

        const isValid = await bcrypt.compare(credentials.password as string, user.hashedPassword);

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.imageUrl,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.provider = "credentials";
      }

      // Refresh user data from DB on session update
      if (trigger === "update" && session) {
        token.name = session.name ?? token.name;
      }

      // Fetch latest user data from DB for role/subscription info
      if (token.id) {
        const dbUser = await db.user.findUnique({
          where: { id: token.id as string },
          select: {
            id: true,
            name: true,
            email: true,
            imageUrl: true,
            provider: true,
            nativeLanguage: true,
            targetLanguage: true,
            proficiencyLevel: true,
            subscription: {
              select: { plan: true, status: true },
            },
          },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.name = dbUser.name;
          token.email = dbUser.email;
          token.picture = dbUser.imageUrl;
          token.provider = dbUser.provider;
          token.nativeLanguage = dbUser.nativeLanguage;
          token.targetLanguage = dbUser.targetLanguage;
          token.proficiencyLevel = dbUser.proficiencyLevel;
          token.subscriptionPlan = dbUser.subscription?.plan ?? "free";
          token.subscriptionStatus = dbUser.subscription?.status ?? "active";
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.provider = token.provider as string;
        session.user.nativeLanguage = token.nativeLanguage as string;
        session.user.targetLanguage = token.targetLanguage as string | null;
        session.user.proficiencyLevel = token.proficiencyLevel as string;
        session.user.subscriptionPlan = token.subscriptionPlan as string;
        session.user.subscriptionStatus = token.subscriptionStatus as string;
      }
      return session;
    },
    async signIn({ user, account }) {
      // For OAuth providers, update the user provider field
      if (account?.provider === "google" && user.email) {
        const existingUser = await db.user.findUnique({
          where: { email: user.email },
        });

        if (existingUser && existingUser.provider === "email") {
          // User already registered with email — update provider to google
          await db.user.update({
            where: { id: existingUser.id },
            data: { provider: "google" },
          });
        } else if (!existingUser) {
          // New Google user — will be created by adapter
        }
      }
      return true;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
});
