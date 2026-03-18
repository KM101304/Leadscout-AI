"use client";

import { useState } from "react";
import { Download } from "lucide-react";
export function ExportButton({
  sessionId,
  leadIds,
  filename,
  label = "Export selected"
}: {
  sessionId: string;
  leadIds: string[];
  filename: string;
  label?: string;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleClick = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          sessionId,
          leadIds
        })
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Unable to export the selected leads.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to export the selected leads.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        className="glass-button inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/12 px-5 py-3 text-sm font-semibold text-cyan-100 hover:bg-cyan-400/18 disabled:cursor-not-allowed disabled:opacity-70"
      >
        <Download className="h-4 w-4" />
        {isLoading ? "Preparing export..." : label}
      </button>
      {error ? <p className="text-xs text-rose-200">{error}</p> : null}
    </div>
  );
}
