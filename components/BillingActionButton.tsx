"use client";

import { useState } from "react";
import { PlanTier } from "@/lib/plans";

export function BillingActionButton({
  action,
  planTier,
  label,
  className,
  disabled = false
}: {
  action: "checkout" | "portal";
  planTier?: Exclude<PlanTier, "free">;
  label: string;
  className?: string;
  disabled?: boolean;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const onClick = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(action === "checkout" ? "/api/stripe/checkout" : "/api/stripe/portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: action === "checkout" ? JSON.stringify({ planTier }) : "{}"
      });

      const payload = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !payload.url) {
        throw new Error(payload.error || "Unable to continue to Stripe.");
      }

      window.location.assign(payload.url);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to continue to Stripe.");
      setIsLoading(false);
      return;
    }
  };

  return (
    <div className="grid gap-2">
      <button type="button" onClick={onClick} disabled={disabled || isLoading} className={className}>
        {isLoading ? "Redirecting..." : label}
      </button>
      {error ? <p className="text-xs text-rose-300">{error}</p> : null}
    </div>
  );
}
