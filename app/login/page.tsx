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
      <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(380px,0.8fr)] lg:items-center">
        <section className="space-y-6">
          <Badge tone="success">Production access flow</Badge>
          <div className="space-y-4">
            <h2 className="font-heading text-4xl font-semibold leading-tight text-white md:text-6xl">
              Keep your prospecting workspace secure and usable.
            </h2>
            <p className="max-w-2xl text-base text-slate-300">
              This login flow now uses real session handling, route protection, and persistent auth instead of placeholder account state.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="feature-tile p-5">
              <p className="font-medium text-white">Session cookies</p>
              <p className="mt-2 text-sm text-slate-300">Protected pages stay protected and refresh cleanly.</p>
            </div>
            <div className="feature-tile p-5">
              <p className="font-medium text-white">Useful errors</p>
              <p className="mt-2 text-sm text-slate-300">Credential issues surface clearly instead of failing silently.</p>
            </div>
            <div className="feature-tile p-5">
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
