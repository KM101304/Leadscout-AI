import { redirect } from "next/navigation";
import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseAuth } from "@/lib/supabase/shared";
import { PlanTier } from "@/lib/plans";

export interface ViewerContext {
  user: User | null;
  subscription: {
    tier: PlanTier;
    leadsUsedThisMonth: number;
    leadsLimit: number;
  };
}

const defaultViewer: ViewerContext = {
  user: null,
  subscription: {
    tier: "free",
    leadsUsedThisMonth: 0,
    leadsLimit: 25
  }
};

export const getViewer = cache(async (): Promise<ViewerContext> => {
  if (!hasSupabaseAuth) {
    return defaultViewer;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    return {
      ...defaultViewer,
      user
    };
  } catch {
    return defaultViewer;
  }
});

export async function requireViewer() {
  const viewer = await getViewer();

  if (!viewer.user) {
    redirect("/login");
  }

  return viewer;
}
