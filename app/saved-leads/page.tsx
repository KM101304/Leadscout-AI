import Link from "next/link";
import { AppShell } from "@/components/AppShell";

export default async function SavedLeadsPage() {
  return (
    <AppShell title="Saved leads" subtitle="Keep promising opportunities close." activeNav="saved-leads">
      <div className="surface-primary rounded-[24px] px-6 py-16 text-center text-slate-400">
        <p className="text-base text-white">No saved leads yet.</p>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Run a scan from the dashboard and save the leads you want to revisit later.
        </p>
        <Link
          href="/dashboard"
          className="glass-button mt-6 inline-flex h-[46px] items-center justify-center rounded-full border border-white/8 px-5 text-sm font-semibold text-white"
        >
          Start a scan
        </Link>
      </div>
    </AppShell>
  );
}
