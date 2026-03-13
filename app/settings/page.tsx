import { AppShell } from "@/components/AppShell";

export default function SettingsPage() {
  return (
    <AppShell
      title="Settings"
      subtitle="Manage workspace defaults and integrations."
      activeNav="settings"
    >
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="surface-primary rounded-[20px] p-6">
          <p className="meta-text uppercase tracking-[0.32em] text-cyan-300/80">Account</p>
          <div className="mt-4 space-y-3 text-[14px] text-slate-300">
            <p>Email notifications: enabled</p>
            <p>Default export format: CSV</p>
            <p>Workspace mode: solo operator</p>
          </div>
        </section>
        <section className="surface-primary rounded-[20px] p-6">
          <p className="meta-text uppercase tracking-[0.32em] text-cyan-300/80">Integrations</p>
          <div className="mt-4 space-y-3 text-[14px] text-slate-300">
            <p>Google Places: ready when API project is enabled</p>
            <p>OpenAI pitch generation: configured</p>
            <p>Stripe billing: webhook pending deployment URL</p>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
