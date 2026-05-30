"use client";

import { useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { GameRunner } from "@/components/cireern/game-runner";
import { getGameMaxLevel } from "@/lib/cireern-data";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RightPanel } from "@/components/dashboard/right-panel";

export default function GameSessionPage() {
  const params = useParams<{ gameId: string }>();
  const searchParams = useSearchParams();
  const gameId = params?.gameId ?? "game";
  const parsedLevel = Number(searchParams.get("level"));
  const maxLevel = getGameMaxLevel(gameId);
  const safeLevel = Number.isFinite(parsedLevel) ? Math.max(1, Math.min(maxLevel, parsedLevel)) : 1;
  const seedParam = searchParams.get("seed");
  const mazeSeed = useMemo(() => {
    const n = Number(seedParam);
    if (Number.isFinite(n) && n > 0) return Math.floor(n);
    return Math.floor(Math.random() * 2_147_483_647);
  }, [seedParam]);

  const right = (
    <RightPanel
      userName="Explorer"
      latestTitle={undefined}
      latestMeta="Finish this game to record a session."
      latestHref={undefined}
      progressItems={[]}
    />
  );

  return (
    <DashboardShell right={right}>
      <div className="space-y-4">
        <h1 className="font-display text-2xl font-bold tracking-tight text-cg-text">
          Now Playing: {gameId} (Level {safeLevel})
        </h1>
        <div className="rounded-2xl border-2 border-[var(--cg-3d-border)] bg-cg-card p-4 shadow-[var(--cg-3d-shadow)]">
          <GameRunner
            key={`${gameId}-${safeLevel}-${mazeSeed}`}
            gameId={gameId}
            level={safeLevel}
            mazeSeed={mazeSeed}
          />
        </div>
      </div>
    </DashboardShell>
  );
}
