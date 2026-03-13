import { AppShell } from "@/components/AppShell";

export default function SettingsPage() {
  return (
    <AppShell
      title="Settings"
      subtitle="Manage workspace defaults and integrations."
      activeNav="settings"
    >
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="surface-primary rounded-[24px] p-6">
          <p className="eyebrow">Account</p>
          <div className="mt-4 grid gap-4">
            <div className="rounded-[18px] border border-white/8 bg-white/[0.03] p-4">
              <p className="meta-text text-slate-400">Email notifications</p>
              <p className="mt-2 text-sm text-white">Enabled for saved leads and export updates</p>
            </div>
            <div className="rounded-[18px] border border-white/8 bg-white/[0.03] p-4">
              <p className="meta-text text-slate-400">Default export format</p>
              <p className="mt-2 text-sm text-white">CSV</p>
            </div>
            <div className="rounded-[18px] border border-white/8 bg-white/[0.03] p-4">
              <p className="meta-text text-slate-400">Workspace mode</p>
              <p className="mt-2 text-sm text-white">Solo operator</p>
            </div>
          </div>
        </section>
        <section className="surface-primary rounded-[24px] p-6">
          <p className="eyebrow">Integrations</p>
          <div className="mt-4 grid gap-4">
            <div className="rounded-[18px] border border-white/8 bg-white/[0.03] p-4">
              <p className="meta-text text-slate-400">Google Places</p>
              <p className="mt-2 text-sm text-white">Ready when the API project is enabled</p>
            </div>
            <div className="rounded-[18px] border border-white/8 bg-white/[0.03] p-4">
              <p className="meta-text text-slate-400">OpenAI pitch generation</p>
              <p className="mt-2 text-sm text-white">Configured</p>
            </div>
            <div className="rounded-[18px] border border-white/8 bg-white/[0.03] p-4">
              <p className="meta-text text-slate-400">Stripe billing</p>
              <p className="mt-2 text-sm text-white">Webhook pending deployment URL</p>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
