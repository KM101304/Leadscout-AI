"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { hasSupabaseAuth } from "@/lib/supabase/shared";

export function LogoutButton({ className = "" }: { className?: string }) {
  const router = useRouter();

  const onLogout = async () => {
    if (hasSupabaseAuth) {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
    }

    router.replace("/login");
    router.refresh();
  };

  return (
    <button type="button" onClick={onLogout} className={className}>
      <LogOut className="h-4 w-4" />
      Logout
    </button>
  );
}
