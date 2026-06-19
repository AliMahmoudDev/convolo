import { ConvoloLogoFull } from "@/components/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Left side — Branding */}
      <div className="gradient-conbolo relative hidden items-center justify-center p-12 lg:flex lg:w-1/2">
        <div className="dot-pattern absolute inset-0 opacity-10" />
        <div className="absolute top-1/4 -left-20 h-[400px] w-[400px] rounded-full bg-white opacity-5 blur-[100px]" />
        <div className="absolute -right-20 bottom-1/4 h-[300px] w-[300px] rounded-full bg-white opacity-5 blur-[100px]" />
        <div className="relative z-10 max-w-md text-center">
          <ConvoloLogoFull size="lg" className="mb-8 justify-center [&>span]:text-white" />
          <h1
            className="mb-4 text-3xl font-bold text-white"
            style={{ fontFamily: "var(--font-heading-cfg)" }}
          >
            Conversation, Unlocked.
          </h1>
          <p className="text-lg leading-relaxed text-white/70">
            Master any language through real conversations with AI. Practice speaking, get instant
            corrections, and build fluency naturally.
          </p>
        </div>
      </div>

      {/* Right side — Auth form */}
      <div className="flex flex-1 items-center justify-center bg-[var(--bg-base)] p-6 sm:p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 text-center lg:hidden">
            <ConvoloLogoFull size="default" className="justify-center" />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
