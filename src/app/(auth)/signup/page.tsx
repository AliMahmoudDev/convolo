import type { Metadata } from "next";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Sign Up — Convolo",
  description:
    "Create your free Convolo account and start learning languages through real AI conversations.",
};

export default function SignupPage() {
  return <SignupForm />;
}
