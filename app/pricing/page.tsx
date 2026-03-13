import { PricingExperience } from "@/components/PricingExperience";
import { SectionHeading } from "@/components/ui";
import { placeholderAuth } from "@/lib/placeholders";

export default function PricingPage() {
  return (
    <main className="shell py-14">
      <SectionHeading
        eyebrow="Pricing"
        title="Pricing built around how serious your outbound workflow is"
        description="The paid value should feel operational: faster qualification, better pitch prep, and cleaner team execution."
      />

      <div className="mt-10">
        <PricingExperience currentTier={placeholderAuth.subscription.tier} />
      </div>
    </main>
  );
}
