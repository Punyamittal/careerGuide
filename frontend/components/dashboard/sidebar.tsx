"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { getClientSettings } from "@/lib/settings-storage";
import {
  IconCourses,
  IconLogout,
  IconOverview,
  IconSchedule,
  IconSetting,
  IconWishlist
} from "./icons";
import { UPGRADE_GIFT_IMAGE } from "./card-art";
import { useHash } from "./use-hash";

const NAV = [
  {
    label: "Overview",
    href: "/overview?tab=overview",
    icon: IconOverview,
    match: (p: string, h: string, t?: string | null) =>
      (p === "/overview" && (!t || t === "overview")) || (p === "/dashboard" && h !== "#popular" && h !== "#explore")
  },
  { label: "Career Dashboard", href: "/overview?tab=career-dashboard", icon: IconOverview, match: (p: string, _h: string, t?: string | null) => p === "/overview" && t === "career-dashboard" },
  { label: "Assessments", href: "/overview?tab=assessments", icon: IconCourses, match: (p: string, _h: string, t?: string | null) => p === "/overview" && t === "assessments" },
  { label: "IQ Games", href: "/overview?tab=iq-games", icon: IconSchedule, match: (p: string, _h: string, t?: string | null) => p === "/overview" && t === "iq-games" },
  { label: "Physiology Games", href: "/overview?tab=physiology-games", icon: IconSchedule, match: (p: string, _h: string, t?: string | null) => p === "/overview" && t === "physiology-games" },
  { label: "Career Matches", href: "/overview?tab=career-matches", icon: IconOverview, match: (p: string, _h: string, t?: string | null) => p === "/overview" && t === "career-matches" },
  { label: "Reports", href: "/overview?tab=reports", icon: IconWishlist, match: (p: string, _h: string, t?: string | null) => p === "/overview" && t === "reports" },
  { label: "Settings", href: "/overview?tab=settings", icon: IconSetting, match: (p: string, _h: string, t?: string | null) => p === "/overview" && t === "settings" }
] as const;

const navActiveClass =
  "border-2 border-emerald-900 bg-emerald-600 text-white shadow-[3px_3px_0_0_#14532d] ring-2 ring-emerald-300";
const navInactiveClass =
  "border-2 border-transparent text-cg-muted hover:-translate-x-px hover:-translate-y-px hover:border-[var(--cg-3d-border)] hover:bg-white hover:text-cg-text hover:shadow-[3px_3px_0_0_var(--cg-3d-border)]";

type SidebarProps = {
  onNavigate?: () => void;
};

export function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");
  const hash = useHash();
  const { logout, loading, user } = useAuth();
  const [compactHints, setCompactHints] = useState(false);

  useEffect(() => {
    const sync = () => setCompactHints(getClientSettings().compactSidebarHints);
    sync();
    window.addEventListener("cg-settings-changed", sync);
    return () => window.removeEventListener("cg-settings-changed", sync);
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden border-r-2 border-[var(--cg-3d-border)] bg-cg-card px-4 py-4 shadow-[inset_-4px_0_0_0_rgba(0,0,0,0.03)] lg:min-h-full">
      <Link
        href="/dashboard"
        onClick={onNavigate}
        className="font-display text-xl font-extrabold leading-tight tracking-tight text-cg-text"
      >
        CareerGuide<span className="text-cg-accent">.</span>
      </Link>
      {!compactHints ? (
        <p className="mt-0.5 text-[10px] font-medium leading-snug text-cg-muted">
          Psychometric career intelligence
        </p>
      ) : null}

      <nav className="mt-5 flex flex-col gap-1">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = item.match(pathname, hash, tab);
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={onNavigate}
              className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-1.5 text-[13px] font-semibold leading-tight transition-all duration-200 ease-out ${
                active ? navActiveClass : navInactiveClass
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${active ? "text-white" : "opacity-80"}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto shrink-0 space-y-2.5 pt-3">
        <button
          type="button"
          onClick={() => logout()}
          disabled={loading}
          className="flex w-full items-center gap-2 rounded-xl border-2 border-[var(--cg-3d-border)] bg-white px-3 py-2 text-left text-[13px] font-semibold text-cg-text shadow-[3px_3px_0_0_var(--cg-3d-border)] transition hover:-translate-x-px hover:-translate-y-px hover:shadow-[4px_4px_0_0_var(--cg-3d-border)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0_0_var(--cg-3d-border)] disabled:opacity-50"
        >
          <IconLogout className="h-4 w-4 shrink-0" />
          Log out
          {user?.name ? <span className="ml-auto truncate text-[10px] font-medium text-cg-muted">{user.name}</span> : null}
        </button>

        <div className="rounded-xl border-2 border-[var(--cg-3d-border)] bg-cg-accent-soft p-2.5 shadow-[var(--cg-3d-shadow)]">
          <div className="relative mb-2 h-14 w-full overflow-hidden rounded-lg border-2 border-[var(--cg-3d-border)] bg-gradient-to-br from-sky-100 to-indigo-50 shadow-[2px_2px_0_0_var(--cg-3d-border)]">
            <Image
              src={UPGRADE_GIFT_IMAGE}
              alt="Lush green Japanese countryside with a river"
              fill
              sizes="(max-width: 260px) 100vw, 220px"
              className="object-cover object-center"
            />
          </div>
          <p className="text-xs font-bold leading-tight text-cg-text">Upgrade to a PRO plan</p>
          <p className="mt-0.5 line-clamp-2 text-[10px] font-medium leading-snug text-cg-muted">
            Unlock deeper reports &amp; AI mentor sessions.
          </p>
          <Link
            href="/overview?tab=assessments"
            onClick={onNavigate}
            className="mt-2 block w-full rounded-lg border-2 border-[var(--cg-3d-border)] bg-white py-1.5 text-center text-xs font-bold text-cg-text shadow-[3px_3px_0_0_var(--cg-3d-border)] transition hover:-translate-x-px hover:-translate-y-px hover:bg-zinc-50 hover:shadow-[4px_4px_0_0_var(--cg-3d-border)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0_0_var(--cg-3d-border)]"
          >
            Get Started
          </Link>
        </div>
      </div>
    </div>
  );
}
