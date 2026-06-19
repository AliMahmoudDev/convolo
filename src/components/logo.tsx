/**
 * Convolo Logo — SVG Component
 * Concept: Stylized "C" formed by overlapping speech bubbles
 * representing the dialogue between learner and AI.
 * Gradient: Electric Violet (#6C5CE7) → Cyber Cyan (#00D2FF)
 */

export function ConvoloLogo({
  className = "",
  size = "default",
}: {
  className?: string;
  size?: "sm" | "default" | "lg";
}) {
  const dimensions = {
    sm: { width: 28, height: 28, text: "text-lg" },
    default: { width: 32, height: 32, text: "text-xl" },
    lg: { width: 48, height: 48, text: "text-3xl" },
  };

  const { width, height } = dimensions[size];

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Convolo logo"
    >
      <defs>
        <linearGradient id="convolo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6C5CE7" />
          <stop offset="100%" stopColor="#00D2FF" />
        </linearGradient>
        <linearGradient id="convolo-gradient-hover" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#5A4BD1" />
          <stop offset="100%" stopColor="#00B8E6" />
        </linearGradient>
      </defs>

      {/* Background rounded square */}
      <rect x="2" y="2" width="60" height="60" rx="16" ry="16" fill="url(#convolo-gradient)" />

      {/* Speech bubble 1 (larger, behind) — represents AI */}
      <path
        d="M18 20C18 17.7909 19.7909 16 22 16H34C36.2091 16 38 17.7909 38 20V32C38 34.2091 36.2091 36 34 36H28L22 42V36H22C19.7909 36 18 34.2091 18 32V20Z"
        fill="white"
        fillOpacity="0.25"
      />

      {/* Speech bubble 2 (smaller, in front) — represents user */}
      <path
        d="M26 24C26 21.7909 27.7909 20 30 20H42C44.2091 20 46 21.7909 46 24V36C46 38.2091 44.2091 40 42 40H36L30 46V40H30C27.7909 40 26 38.2091 26 36V24Z"
        fill="white"
        fillOpacity="0.9"
      />

      {/* "C" letterform created by the negative space / cutout */}
      <path
        d="M30 27C31.6569 25.3431 34.3137 25.3431 35.9706 27C37.6274 28.6569 37.6274 31.3137 35.9706 32.9706C34.3137 34.6274 31.6569 34.6274 30 32.9706"
        stroke="url(#convolo-gradient)"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

/**
 * Convolo Logo with Wordmark — Logo + "Convolo" text
 */
export function ConvoloLogoFull({
  className = "",
  size = "default",
}: {
  className?: string;
  size?: "sm" | "default" | "lg";
}) {
  const textSize = {
    sm: "text-base",
    default: "text-xl",
    lg: "text-3xl",
  };

  return (
    <div className={`group flex items-center gap-2.5 ${className}`}>
      <ConvoloLogo
        size={size}
        className="transition-transform duration-200 group-hover:scale-105"
      />
      <span
        className={`font-bold text-[var(--text-primary)] ${textSize[size]}`}
        style={{ fontFamily: "var(--font-heading-cfg)" }}
      >
        Convolo
      </span>
    </div>
  );
}
