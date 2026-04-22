"use client";

import { useParams, useSearchParams } from "next/navigation";
import { GameRunner } from "@/components/cireern/game-runner";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RightPanel } from "@/components/dashboard/right-panel";

export default function GameSessionPage() {
  const params = useParams<{ gameId: string }>();
  const searchParams = useSearchParams();
  const gameId = params?.gameId ?? "game";
  const parsedLevel = Number(searchParams.get("level"));
  const safeLevel = Number.isFinite(parsedLevel) ? Math.max(1, Math.min(10, parsedLevel)) : 1;

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
          <GameRunner gameId={gameId} level={safeLevel} />
        </div>
      </div>
    </DashboardShell>
  );
}
