"use client";

import { useMemo, useState } from "react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RightPanel } from "@/components/dashboard/right-panel";
import { gameCatalog } from "@/lib/cireern-data";
import { GameCard } from "@/components/cireern/ui";

export default function PlayPage() {
  const [type, setType] = useState<"all" | "iq" | "physiology">("all");
  const [query, setQuery] = useState("");
  const games = useMemo(
    () =>
      gameCatalog.filter(
        (game) =>
          (type === "all" || game.type === type) &&
          game.name.toLowerCase().includes(query.toLowerCase())
      ),
    [query, type]
  );

  const right = (
    <RightPanel
      userName="Explorer"
      latestTitle={undefined}
      latestMeta="Pick a game to start building your profile."
      latestHref={undefined}
      progressItems={[]}
    />
  );

  return (
    <DashboardShell right={right}>
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-bold tracking-tight text-cg-text">Game Lobby</h1>
          <p className="text-sm text-cg-muted">Practice IQ and physiology games from the same dashboard format.</p>
        </div>

        <div className="rounded-2xl border-2 border-[var(--cg-3d-border)] bg-cg-card p-4 shadow-[var(--cg-3d-shadow)]">
          <div className="flex flex-wrap gap-2">
            {(["all", "iq", "physiology"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setType(item)}
                className={`rounded-xl border-2 px-4 py-2 text-sm font-semibold ${
                  type === item
                    ? "border-[var(--cg-tab-active-border)] bg-[var(--cg-tab-active-bg)] text-white"
                    : "border-[var(--cg-3d-border)] bg-white text-cg-text"
                }`}
              >
                {item.toUpperCase()}
              </button>
            ))}
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="min-w-[220px] flex-1 rounded-xl border-2 border-[var(--cg-3d-border)] bg-white px-4 py-2 text-sm text-cg-text"
              placeholder="Search game..."
            />
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {games.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </section>
      </div>
    </DashboardShell>
  );
}
