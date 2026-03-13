"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Search, Star, UserCircle2 } from "lucide-react";

const tabs = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, match: (pathname: string) => pathname === "/dashboard" },
  { href: "/dashboard", label: "Search", icon: Search, match: (pathname: string) => pathname === "/results" || pathname.startsWith("/results/") },
  { href: "/saved-leads", label: "Saved", icon: Star, match: (pathname: string) => pathname === "/saved-leads" },
  { href: "/settings", label: "Account", icon: UserCircle2, match: (pathname: string) => pathname === "/settings" }
] as const;

export function MobileTabNav() {
  const pathname = usePathname();

  return (
    <nav className="mobile-tab-nav lg:hidden" aria-label="Mobile navigation">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.match(pathname);

        return (
          <Link key={tab.label} href={tab.href} className={`mobile-tab-nav__item ${isActive ? "is-active" : ""}`}>
            <Icon className="h-[18px] w-[18px]" />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
