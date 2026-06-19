import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign In — Convolo",
  description: "Sign in to your Convolo account and continue your language learning journey.",
};

export default function LoginPage() {
  return <LoginForm />;
}
