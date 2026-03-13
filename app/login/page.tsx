import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { Badge } from "@/components/ui";
import { getViewer } from "@/lib/auth";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const viewer = await getViewer();
  const params = await searchParams;

  if (viewer.user) {
    redirect("/dashboard");
  }

  return (
    <main className="shell py-10 md:py-16">
      <div className="app-page-stack lg:grid lg:grid-cols-[minmax(0,0.9fr)_minmax(380px,0.8fr)] lg:items-center">
        <section className="space-y-6">
          <Badge tone="success">Secure workspace access</Badge>
          <div className="space-y-4">
            <h2 className="font-heading text-4xl font-semibold leading-tight text-white md:text-6xl">
              Keep your prospecting workspace secure and usable.
            </h2>
            <p className="max-w-2xl text-base text-slate-300">
              LeadScout keeps auth, redirects, and session state clean so the product feels production-ready instead of stitched together.
            </p>
          </div>
          <div className="app-card-grid sm:grid-cols-3">
            <div className="feature-tile section-block">
              <p className="font-medium text-white">Session cookies</p>
              <p className="mt-2 text-sm text-slate-300">Protected pages stay protected and refresh cleanly.</p>
            </div>
            <div className="feature-tile section-block">
              <p className="font-medium text-white">Useful errors</p>
              <p className="mt-2 text-sm text-slate-300">Credential issues surface clearly instead of failing silently.</p>
            </div>
            <div className="feature-tile section-block">
              <p className="font-medium text-white">Clean redirect flow</p>
              <p className="mt-2 text-sm text-slate-300">Successful auth sends users back into the app immediately.</p>
            </div>
          </div>
        </section>

        <LoginForm nextPath={params.next || "/dashboard"} />
      </div>
    </main>
  );
}
