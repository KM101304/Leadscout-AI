"use client";

import { Lead } from "@/lib/types";
import { Download } from "lucide-react";

function toCsv(leads: Lead[]) {
  const header = [
    "business_name",
    "phone",
    "website",
    "address",
    "lead_score",
    "issues",
    "opportunity_type",
    "pitch_suggestion"
  ];

  const rows = leads.map((lead) => [
    lead.businessName,
    lead.phone,
    lead.website,
    lead.address,
    String(lead.leadScore),
    lead.issueLabels.join("; "),
    lead.opportunityType,
    lead.pitch.serviceSuggestion
  ]);

  return [header, ...rows]
    .map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(","))
    .join("\n");
}

export function ExportButton({ leads, filename }: { leads: Lead[]; filename: string }) {
  const handleClick = () => {
    const csv = toCsv(leads);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="glass-button inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/12 px-5 py-3 text-sm font-semibold text-cyan-100 hover:bg-cyan-400/18"
    >
      <Download className="h-4 w-4" />
      Export selected
    </button>
  );
}
