"use client";

import { useState } from "react";
import { IconClose, IconMenu } from "./icons";
import { Sidebar } from "./sidebar";

type DashboardShellProps = {
  children: React.ReactNode;
  right: React.ReactNode;
};

export function DashboardShell({ children, right }: DashboardShellProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-cg-canvas p-2 sm:p-4">
      <div className="mx-auto flex max-w-[1600px] min-h-[calc(100dvh-1rem)] flex-col overflow-hidden rounded-[1.5rem] border-2 border-[var(--cg-3d-border)] bg-cg-canvas shadow-[var(--cg-3d-shadow)] lg:h-[calc(100dvh-2rem)] lg:min-h-0 lg:flex-row lg:items-stretch">
        <div className="flex items-center justify-between border-b-2 border-[var(--cg-3d-border)] bg-cg-card px-4 py-3 lg:hidden">
          <span className="font-display text-xl font-extrabold text-cg-text">
            CareerGuide<span className="text-cg-accent">.</span>
          </span>
          <button
            type="button"
            className="rounded-lg border-2 border-[var(--cg-3d-border)] bg-white p-2 text-cg-text shadow-[3px_3px_0_0_var(--cg-3d-border)] transition hover:-translate-x-px hover:-translate-y-px hover:shadow-[4px_4px_0_0_var(--cg-3d-border)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0_0_var(--cg-3d-border)]"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <IconClose /> : <IconMenu />}
          </button>
        </div>

        <div
          className={`fixed inset-0 z-40 bg-black/25 transition-opacity lg:hidden ${open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
          aria-hidden={!open}
          onClick={() => setOpen(false)}
        />

        <aside
          className={`fixed inset-y-0 left-0 z-50 flex h-full min-h-0 w-[260px] max-w-[85vw] flex-col overflow-hidden bg-cg-card shadow-[4px_0_0_0_var(--cg-3d-border)] transition-transform duration-200 ease-out lg:static lg:z-0 lg:h-full lg:max-w-none lg:min-h-0 lg:flex-shrink-0 lg:self-stretch lg:shadow-none ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        >
          <Sidebar onNavigate={() => setOpen(false)} />
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col xl:flex-row">
          <main className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:max-h-[calc(100dvh-2rem)]">{children}</main>
          <div className="min-h-0 w-full shrink-0 overflow-y-auto border-t-2 border-[var(--cg-3d-border)] bg-[#faf7f2] lg:max-h-[calc(100dvh-2rem)] xl:w-[320px] xl:border-l-2 xl:border-t-0">
            {right}
          </div>
        </div>
      </div>
    </div>
  );
}
