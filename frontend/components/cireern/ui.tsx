import Link from "next/link";
import { cn } from "@/lib/utils";
import type { GameDefinition } from "@/lib/cireern-data";

export function DifficultyBadge({ difficulty }: { difficulty: GameDefinition["difficulty"] }) {
  const styles = {
    beginner: "bg-emerald-100 text-emerald-800",
    intermediate: "bg-amber-100 text-amber-800",
    advanced: "bg-rose-100 text-rose-800"
  };
  return <span className={cn("rounded-full px-2 py-1 text-xs font-semibold", styles[difficulty])}>{difficulty}</span>;
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
      <div className="h-full rounded-full bg-[var(--secondary)] transition-all" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function KPICard({ title, value }: { title: string; value: string }) {
  return (
    <article className="rounded-2xl bg-[var(--card)] p-4 shadow-[var(--shadow-card)]">
      <p className="text-sm text-[var(--muted)]">{title}</p>
      <p className="font-mono text-2xl font-bold text-[var(--primary)]">{value}</p>
    </article>
  );
}

export function GameCard({ game }: { game: GameDefinition }) {
  return (
    <article className="rounded-[var(--radius-card)] bg-[var(--card)] p-4 shadow-[var(--shadow-card)]">
      <div className="mb-3 h-24 rounded-xl bg-gradient-to-br from-sky-100 to-indigo-100" />
      <h3 className="font-display text-lg text-[var(--primary)]">{game.name}</h3>
      <p className="mt-1 text-sm text-[var(--muted)]">
        {game.type === "iq" ? "IQ Game" : "Physiology"} • Ages {game.ageMin}-{game.ageMax}
      </p>
      <p className="mt-2 text-sm">Skills: {game.skills.join(", ")}</p>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-sm">⭐ {game.rating}</span>
        <DifficultyBadge difficulty={game.difficulty} />
      </div>
      <Link href={`/play/${game.id}`} className="mt-4 inline-block rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white">
        Play Now
      </Link>
    </article>
  );
}

export function CareerMatchCard({
  career,
  matchPct,
  why
}: {
  career: string;
  matchPct: number;
  why: string[];
}) {
  return (
    <article className="rounded-[var(--radius-card)] bg-[var(--card)] p-5 shadow-[var(--shadow-card)]">
      <h3 className="font-display text-xl text-[var(--primary)]">{career}</h3>
      <p className="mt-2 text-sm text-[var(--muted)]">Match Score: {matchPct}%</p>
      <div className="mt-2">
        <ProgressBar value={matchPct} />
      </div>
      <ul className="mt-3 space-y-1 text-sm">
        {why.map((reason) => (
          <li key={reason}>• {reason}</li>
        ))}
      </ul>
    </article>
  );
}
