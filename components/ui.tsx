import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export function Badge({
  children,
  tone = "default",
  className
}: {
  children: ReactNode;
  tone?: "default" | "success" | "warning" | "danger" | "info";
  className?: string;
}) {
  const toneClass = {
    default: "border-white/8 bg-white/[0.04] text-slate-200",
    success: "border-emerald-400/18 bg-emerald-400/10 text-emerald-200",
    warning: "border-amber-400/18 bg-amber-400/10 text-amber-200",
    danger: "border-rose-400/18 bg-rose-400/10 text-rose-200",
    info: "border-sky-400/18 bg-sky-400/10 text-sky-200"
  }[tone];

  return (
    <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-[12px] font-medium", toneClass, className)}>
      {children}
    </span>
  );
}

export function ScorePill({ score }: { score: number }) {
  const tone = score >= 80 ? "success" : score >= 60 ? "warning" : "danger";
  return <Badge tone={tone} className="score-pulse">{score}/100</Badge>;
}

export function IssueBadge({ issue }: { issue: string }) {
  const tone =
    /no website|outdated|broken|weak seo/i.test(issue)
      ? "danger"
      : /slow|poor mobile|low review|no ssl/i.test(issue)
        ? "warning"
        : "default";

  return <Badge tone={tone}>{issue}</Badge>;
}

export function SectionHeading({
  eyebrow,
  title,
  description
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="space-y-3">
      <p className="meta-text uppercase tracking-[0.32em] text-cyan-300/80">{eyebrow}</p>
      <h2 className="section-title text-white md:text-[20px]">{title}</h2>
      {description ? <p className="max-w-3xl text-[14px] text-slate-300">{description}</p> : null}
    </div>
  );
}
