import Link from "next/link";
import { Badge } from "@/components/ui";
import { LockKeyhole, Sparkles } from "lucide-react";

export function UpgradePrompt({
  tier,
  title,
  description,
  bullets
}: {
  tier: "starter" | "pro" | "agency";
  title: string;
  description: string;
  bullets: string[];
}) {
  return (
    <section className="surface-primary rounded-[24px] section-block md:p-7">
      <div className="flex items-center justify-between gap-3">
        <Badge tone={tier === "agency" ? "default" : "warning"}>
          {tier === "starter" ? "Starter unlock" : tier === "pro" ? "Pro unlock" : "Agency unlock"}
        </Badge>
        {tier === "agency" ? <LockKeyhole className="h-5 w-5 text-violet-300" /> : <Sparkles className="h-5 w-5 text-cyan-300" />}
      </div>
      <h3 className="section-title mt-4 text-white">{title}</h3>
      <p className="mt-3 text-[14px] text-slate-300">{description}</p>
      <div className="mt-6 app-card-grid-tight">
        {bullets.map((bullet) => (
          <div key={bullet} className="surface-minimal rounded-[18px] border border-white/6 px-4 py-3.5 text-[14px] leading-6 text-slate-200">
            {bullet}
          </div>
        ))}
      </div>
      <Link
        href="/pricing"
        className="cta-primary glass-button mt-6 inline-flex rounded-full px-5 py-3 text-[14px] font-semibold"
      >
        See paid plans
      </Link>
    </section>
  );
}
