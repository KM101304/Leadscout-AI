import { PricingExperience } from "@/components/PricingExperience";
import { SectionHeading } from "@/components/ui";
import { getViewer } from "@/lib/auth";

export default async function PricingPage() {
  const viewer = await getViewer();

  return (
    <main className="shell py-10 md:py-14">
      <SectionHeading
        eyebrow="Pricing"
        title="Pricing built around how serious your outbound workflow is"
        description="The paid value should feel operational: faster qualification, better pitch prep, and cleaner team execution."
      />

      <div className="mt-10">
        <PricingExperience currentTier={viewer.subscription.tier} />
      </div>
    </main>
  );
}
