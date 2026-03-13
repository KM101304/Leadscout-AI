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
            <linearGradient id="leadscout-brand-gradient" x1="6" y1="8" x2="48" y2="48" gradientUnits="userSpaceOnUse">
              <stop stopColor="#8BE9FD" />
              <stop offset="0.55" stopColor="#38BDF8" />
              <stop offset="1" stopColor="#FBBF24" />
            </linearGradient>
          </defs>
          <rect x="4" y="4" width="48" height="48" rx="16" fill="rgba(8,16,28,0.88)" stroke="rgba(139,233,253,0.22)" />
          <path
            d="M17 34.5V21.5C17 18.5 19.5 16 22.5 16H36"
            fill="none"
            stroke="url(#leadscout-brand-gradient)"
            strokeLinecap="round"
            strokeWidth="4.25"
          />
          <path
            d="M22 39.5H33.5C37.642 39.5 41 36.142 41 32V20"
            fill="none"
            stroke="rgba(236,243,255,0.92)"
            strokeLinecap="round"
            strokeWidth="4.25"
          />
          <circle cx="37.5" cy="18.5" r="4.5" fill="#FBBF24" />
        </svg>
      </span>
      {!compact ? (
        <span className="grid gap-0.5 leading-none">
          <span className="font-heading text-[1.02rem] font-semibold tracking-[-0.03em] text-white">LeadScout</span>
          <span className="text-[0.66rem] font-semibold uppercase tracking-[0.28em] text-cyan-200/72">Revenue Intel</span>
        </span>
      ) : null}
    </div>
  );
}
