import { PlanTier } from "@/lib/plans";

export const placeholderAuth = {
  currentUser: {
    id: "user_demo_001",
    email: "demo@leadscout.ai"
  },
  subscription: {
    tier: "free" as PlanTier,
    leadsUsedThisMonth: 18,
    leadsLimit: 25
  }
};

export const stripePlans = [
  {
    name: "Free",
    price: "$0",
    description: "25 leads per month"
  },
  {
    name: "Pro",
    price: "$49",
    description: "Unlimited searches, CSV exports, AI pitch generation"
  },
  {
    name: "Agency",
    price: "$149",
    description: "Team accounts, bulk exports, advanced lead scoring"
  }
];
