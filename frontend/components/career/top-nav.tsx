"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Career", href: "/career" },
  { label: "Games", href: "/play" },
  { label: "Profile", href: "/profile" },
  { label: "Reports", href: "/reports" }
] as const;

export function CireernTopNav() {
  const pathname = usePathname();
  return (
    <nav className="rounded-2xl border-2 border-[var(--cg-3d-border)] bg-cg-card p-3 shadow-[var(--cg-3d-shadow)]">
      <div className="flex flex-wrap gap-2">
        {links.map((link) => {
          const active = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                active
                  ? "bg-[var(--primary)] text-white"
                  : "border border-[var(--cg-3d-border)] bg-white text-cg-text"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
