import { AppShell } from "@/components/AppShell";
import { BillingActionButton } from "@/components/BillingActionButton";
import { getViewer } from "@/lib/auth";
import { getBillingSubscriptionByUserId, isBillingConfigured } from "@/services/billingService";

export default async function SettingsPage() {
  const viewer = await getViewer();
  const billing = viewer.user ? await getBillingSubscriptionByUserIdSafe(viewer.user.id) : null;

  return (
    <AppShell
      title="Settings"
      subtitle="Manage workspace defaults and integrations."
      activeNav="settings"
    >
      <div className="app-page-stack xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:grid">
        <section className="surface-primary rounded-[28px] section-block">
          <p className="eyebrow">Account</p>
          <div className="mt-4 app-card-grid-tight">
            <div className="subtle-panel rounded-[18px] section-subtle">
              <p className="meta-text text-slate-400">Email notifications</p>
              <p className="mt-2 text-sm text-white">Enabled for saved leads and export updates</p>
            </div>
            <div className="subtle-panel rounded-[18px] section-subtle">
              <p className="meta-text text-slate-400">Default export format</p>
              <p className="mt-2 text-sm text-white">CSV</p>
            </div>
            <div className="subtle-panel rounded-[18px] section-subtle">
              <p className="meta-text text-slate-400">Workspace mode</p>
              <p className="mt-2 text-sm text-white">Solo operator</p>
            </div>
          </div>
        </section>
        <section className="surface-primary rounded-[28px] section-block">
          <p className="eyebrow">Integrations</p>
          <div className="mt-4 app-card-grid-tight">
            <div className="subtle-panel rounded-[18px] section-subtle">
              <p className="meta-text text-slate-400">Google Places</p>
              <p className="mt-2 text-sm text-white">Ready when the API project is enabled</p>
            </div>
            <div className="subtle-panel rounded-[18px] section-subtle">
              <p className="meta-text text-slate-400">OpenAI pitch generation</p>
              <p className="mt-2 text-sm text-white">Configured</p>
            </div>
            <div className="subtle-panel rounded-[18px] section-subtle">
              <p className="meta-text text-slate-400">Stripe billing</p>
              <p className="mt-2 text-sm text-white">
                {billing
                  ? `${billing.planTier.toUpperCase()} plan · ${billing.status.replaceAll("_", " ")}`
                  : isBillingConfigured()
                    ? "Stripe is configured and ready for checkout"
                    : "Stripe still needs full configuration"}
              </p>
              {viewer.subscription.tier !== "free" ? (
                <div className="mt-4">
                  <BillingActionButton
                    action="portal"
                    label="Manage billing in Stripe"
                    className="glass-button inline-flex rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white"
                  />
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

async function getBillingSubscriptionByUserIdSafe(userId: string) {
  try {
    return await getBillingSubscriptionByUserId(userId);
  } catch {
    return null;
  }
}
