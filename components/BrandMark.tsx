import { cn } from "@/lib/utils";

export function BrandMark({
  compact = false,
  className
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="brand-mark">
        <svg viewBox="0 0 56 56" aria-hidden="true" className="h-7 w-7">
          <defs>
            <linearGradient id="leadscout-brand-gradient" x1="10" y1="9" x2="44" y2="46" gradientUnits="userSpaceOnUse">
              <stop stopColor="#79D2FF" />
              <stop offset="0.62" stopColor="#4CB7FF" />
              <stop offset="1" stopColor="#F5BF62" />
            </linearGradient>
          </defs>
          <rect x="4.5" y="4.5" width="47" height="47" rx="15.5" fill="rgba(8,16,28,0.9)" stroke="rgba(121,210,255,0.2)" />
          <path
            d="M17 34V23C17 19.686 19.686 17 23 17H35"
            fill="none"
            stroke="url(#leadscout-brand-gradient)"
            strokeLinecap="round"
            strokeWidth="4"
          />
          <path
            d="M21.5 39H31.5C36.747 39 41 34.747 41 29.5V21"
            fill="none"
            stroke="rgba(236,243,255,0.92)"
            strokeLinecap="round"
            strokeWidth="4"
          />
          <path
            d="M30 27.5L36.5 21"
            fill="none"
            stroke="rgba(236,243,255,0.92)"
            strokeLinecap="round"
            strokeWidth="3.25"
          />
          <circle cx="38" cy="19.5" r="4.25" fill="#F5BF62" />
        </svg>
      </span>
      {!compact ? (
        <span className="grid gap-0.5 leading-none">
          <span className="font-heading text-[1.02rem] font-semibold tracking-[-0.03em] text-white">LeadScout</span>
          <span className="text-[0.66rem] font-semibold uppercase tracking-[0.28em] text-cyan-100/65">Signal Intelligence</span>
        </span>
      ) : null}
    </div>
  );
}
