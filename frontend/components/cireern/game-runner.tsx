"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useCireernStore } from "@/lib/cireern-store";
import { ProgressBar } from "@/components/cireern/ui";
import { api } from "@/lib/api";
import { gameCatalog } from "@/lib/cireern-data";

type Props = { gameId: string; level?: number };

function createRng(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function hasPath(size: number, walls: Set<string>) {
  const goal = `${size - 1},${size - 1}`;
  const queue: Array<{ x: number; y: number }> = [{ x: 0, y: 0 }];
  const visited = new Set<string>(["0,0"]);
  while (queue.length) {
    const node = queue.shift();
    if (!node) continue;
    const key = `${node.x},${node.y}`;
    if (key === goal) return true;
    const neighbors = [
      { x: node.x + 1, y: node.y },
      { x: node.x - 1, y: node.y },
      { x: node.x, y: node.y + 1 },
      { x: node.x, y: node.y - 1 }
    ];
    for (const next of neighbors) {
      const nx = next.x;
      const ny = next.y;
      if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
      const nKey = `${nx},${ny}`;
      if (walls.has(nKey) || visited.has(nKey)) continue;
      visited.add(nKey);
      queue.push({ x: nx, y: ny });
    }
  }
  return false;
}

function generateMazeWalls(size: number, level: number) {
  const density = Math.min(0.4, 0.12 + level * 0.02);
  const maxWalls = Math.floor(size * size * density);
  const rng = createRng(level * 9871 + size * 31);
  const walls = new Set<string>();
  let attempts = 0;
  while (walls.size < maxWalls && attempts < size * size * 20) {
    attempts += 1;
    const x = Math.floor(rng() * size);
    const y = Math.floor(rng() * size);
    const key = `${x},${y}`;
    if (key === "0,0" || key === `${size - 1},${size - 1}`) continue;
    walls.add(key);
    if (!hasPath(size, walls)) {
      walls.delete(key);
    }
  }
  return walls;
}

function MazeGame({
  level,
  onAction,
  onFinish
}: {
  level: number;
  onAction: (success: boolean) => void;
  onFinish: (score: number, accuracy: number, errors: number, duration: number) => void;
}) {
  const size = Math.min(12, 4 + level);
  const walls = useMemo(() => generateMazeWalls(size, level), [size, level]);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [errors, setErrors] = useState(0);
  const [moves, setMoves] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (done) return;
    const timer = setInterval(() => setElapsed((prev) => prev + 1), 1000);
    return () => clearInterval(timer);
  }, [done]);

  const move = useCallback(
    (dx: number, dy: number) => {
      if (done) return;
      const nx = position.x + dx;
      const ny = position.y + dy;
      setMoves((prev) => prev + 1);
      const key = `${nx},${ny}`;
      if (nx >= 0 && nx < size && ny >= 0 && ny < size && !walls.has(key)) {
        onAction(true);
        setPosition({ x: nx, y: ny });
      } else {
        onAction(false);
        setErrors((prev) => prev + 1);
      }
    },
    [done, onAction, position.x, position.y, size, walls]
  );

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") move(1, 0);
      else if (event.key === "ArrowLeft") move(-1, 0);
      else if (event.key === "ArrowUp") move(0, -1);
      else if (event.key === "ArrowDown") move(0, 1);
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [move]);

  useEffect(() => {
    if (!done && position.x === size - 1 && position.y === size - 1) {
      setDone(true);
      const duration = Math.max(1, elapsed);
      const accuracy = Math.max(0, 1 - errors / Math.max(moves, 1));
      const score = Math.round(100 * accuracy + Math.max(0, 80 - duration) + level * 2);
      onFinish(score, accuracy, errors, duration);
    }
  }, [done, elapsed, errors, level, moves, onFinish, position, size]);

  return (
    <div>
      <p className="mb-3 text-sm">Level {level}: Use arrow keys to reach the bottom-right tile.</p>
      <div className="mb-3 flex gap-2">
        <button type="button" onClick={() => move(0, -1)} className="rounded-lg bg-slate-800 px-3 py-1 text-xs text-white">Up</button>
        <button type="button" onClick={() => move(-1, 0)} className="rounded-lg bg-slate-800 px-3 py-1 text-xs text-white">Left</button>
        <button type="button" onClick={() => move(1, 0)} className="rounded-lg bg-slate-800 px-3 py-1 text-xs text-white">Right</button>
        <button type="button" onClick={() => move(0, 1)} className="rounded-lg bg-slate-800 px-3 py-1 text-xs text-white">Down</button>
      </div>
      <div className="grid w-[300px] gap-1" style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}>
        {Array.from({ length: size * size }).map((_, index) => {
          const x = index % size;
          const y = Math.floor(index / size);
          const active = position.x === x && position.y === y;
          const goal = x === size - 1 && y === size - 1;
          const wall = walls.has(`${x},${y}`);
          return (
            <div
              key={index}
              className={`h-8 rounded ${
                goal ? "bg-emerald-300" : active ? "bg-blue-500" : wall ? "bg-slate-900" : "bg-slate-100"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}

function MemoryGame({
  level,
  onAction,
  onFinish
}: {
  level: number;
  onAction: (success: boolean) => void;
  onFinish: (score: number, accuracy: number, errors: number, duration: number) => void;
}) {
  const initialLength = Math.min(5, 2 + Math.floor((level - 1) / 3));
  const targetLength = Math.min(14, 4 + level);
  const flashMs = Math.max(180, 560 - level * 28);
  const [sequence, setSequence] = useState<number[]>(() =>
    Array.from({ length: initialLength }, () => Math.floor(Math.random() * 9))
  );
  const [input, setInput] = useState<number[]>([]);
  const [errors, setErrors] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [flash, setFlash] = useState<number | null>(null);
  const [showingSequence, setShowingSequence] = useState(true);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (finished) return;
    const timer = setInterval(() => setElapsed((prev) => prev + 1), 1000);
    return () => clearInterval(timer);
  }, [finished]);

  useEffect(() => {
    setShowingSequence(true);
    let i = 0;
    const interval = setInterval(() => {
      setFlash(sequence[i] ?? null);
      i += 1;
      if (i > sequence.length) {
        clearInterval(interval);
        setTimeout(() => {
          setFlash(null);
          setShowingSequence(false);
        }, 250);
      }
    }, flashMs);
    return () => clearInterval(interval);
  }, [flashMs, sequence]);

  const onTileTap = (tile: number) => {
    if (finished || showingSequence) return;
    const nextInput = [...input, tile];
    setInput(nextInput);
    const idx = nextInput.length - 1;
    if (nextInput[idx] !== sequence[idx]) {
      onAction(false);
      setFinished(true);
      setErrors((prev) => prev + 1);
      const duration = Math.max(1, elapsed);
      const attempts = Math.max(1, nextInput.length);
      const accuracy = Math.max(0, (attempts - 1) / attempts);
      onFinish(Math.max(20, sequence.length * 12), accuracy, errors + 1, duration);
      return;
    }
    onAction(true);
    if (nextInput.length === sequence.length) {
      const next = Math.floor(Math.random() * 9);
      if (sequence.length >= targetLength) {
        setFinished(true);
        const duration = Math.max(1, elapsed);
        onFinish(Math.min(100, 80 + level * 2), 0.95, errors, duration);
      } else {
        setSequence((prev) => [...prev, next]);
        setInput([]);
      }
    }
  };

  return (
    <div className="w-full max-w-xs">
      <p className="mb-3 text-sm">Level {level}: Repeat the sequence until length {targetLength}.</p>
      <p className="mb-2 text-xs text-slate-600">
        {showingSequence ? "Watch sequence..." : "Your turn"}
      </p>
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 9 }).map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onTileTap(idx)}
            className={`h-20 rounded-xl ${flash === idx ? "bg-amber-400" : "bg-slate-100"} ${showingSequence ? "opacity-70" : ""}`}
          />
        ))}
      </div>
    </div>
  );
}

function RhythmGame({
  level,
  onAction,
  onFinish
}: {
  level: number;
  onAction: (success: boolean) => void;
  onFinish: (score: number, accuracy: number, errors: number, duration: number) => void;
}) {
  const [streak, setStreak] = useState(0);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const target = useMemo(() => Array.from({ length: 8 + level * 2 }, (_, i) => [0, 2, 1, 3][i % 4]), [level]);
  const durationLimit = Math.max(10, 24 - level);
  const [index, setIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  useEffect(() => {
    if (finished) return;
    const timer = setInterval(() => setElapsed((prev) => prev + 1), 1000);
    return () => clearInterval(timer);
  }, [finished]);
  useEffect(() => {
    if (!finished && elapsed >= durationLimit) {
      setFinished(true);
      const attempts = Math.max(1, hits + misses);
      const accuracy = hits / attempts;
      onFinish(Math.round(accuracy * 100 + level), accuracy, misses, elapsed);
    }
  }, [durationLimit, elapsed, finished, hits, level, misses, onFinish]);

  const tapLane = (lane: number) => {
    if (finished) return;
    const success = lane === target[index];
    onAction(success);
    if (success) {
      setHits((prev) => prev + 1);
      setStreak((prev) => prev + 1);
    } else {
      setMisses((prev) => prev + 1);
      setStreak(0);
    }
    setIndex((prev) => (prev + 1) % target.length);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const lane = Number(event.key) - 1;
      if (lane >= 0 && lane <= 3) tapLane(lane);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [finished, index, target]);

  return (
    <div>
      <p className="mb-2 text-sm">Level {level}: Tap matching lane with keys 1-4.</p>
      <p className="mb-2 text-xs text-slate-600">Target lane: {target[index] + 1}</p>
      <div className="mb-3 h-2 rounded bg-slate-200">
        <div className="h-full rounded bg-[var(--physio)]" style={{ width: `${(elapsed / durationLimit) * 100}%` }} />
      </div>
      <div className="grid grid-cols-4 gap-2">
        {[0, 1, 2, 3].map((lane) => (
          <button
            key={lane}
            type="button"
            onClick={() => tapLane(lane)}
            className={`h-24 rounded-xl text-xl font-bold ${
              target[index] === lane ? "bg-emerald-200 ring-2 ring-emerald-500" : "bg-sky-100"
            }`}
          >
            {lane + 1}
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-slate-600">Hits: {hits} • Misses: {misses} • Streak: {streak}</p>
    </div>
  );
}

function BalanceGame({
  level,
  onAction,
  onFinish
}: {
  level: number;
  onAction: (success: boolean) => void;
  onFinish: (score: number, accuracy: number, errors: number, duration: number) => void;
}) {
  const [drift, setDrift] = useState(0);
  const [time, setTime] = useState(0);
  const [corrections, setCorrections] = useState(0);
  const driftScale = 15 + level * 2;
  const tickMs = Math.max(320, 700 - level * 30);
  const timeLimit = Math.max(12, 32 - level * 2);
  const [finished, setFinished] = useState(false);
  useEffect(() => {
    if (finished) return;
    const timer = setInterval(() => {
      setTime((prev) => prev + 1);
      setDrift((prev) => Math.max(-100, Math.min(100, prev + (Math.random() * driftScale * 2 - driftScale))));
    }, tickMs);
    return () => clearInterval(timer);
  }, [driftScale, finished, tickMs]);
  useEffect(() => {
    if (!finished && (Math.abs(drift) > 95 || time > timeLimit)) {
      setFinished(true);
      const accuracy = Math.max(0.35, 1 - Math.abs(drift) / 100);
      onFinish(Math.round(accuracy * 100 + level), accuracy, Math.max(0, time - corrections), time);
    }
  }, [corrections, drift, finished, level, onFinish, time, timeLimit]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (finished) return;
      if (event.key === "ArrowLeft") {
        onAction(true);
        setDrift((d) => d + (12 + level));
        setCorrections((c) => c + 1);
      } else if (event.key === "ArrowRight") {
        onAction(true);
        setDrift((d) => d - (12 + level));
        setCorrections((c) => c + 1);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [finished, level, onAction]);

  return (
    <div>
      <div className="mb-4 h-6 rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${50 + drift / 2}%` }} />
      </div>
      <div className="flex gap-3">
        <button type="button" className="rounded-xl bg-slate-800 px-4 py-2 text-white" onClick={() => { if (finished) return; onAction(true); setDrift((d) => d + (12 + level)); setCorrections((c) => c + 1); }}>
          Left
        </button>
        <button type="button" className="rounded-xl bg-slate-800 px-4 py-2 text-white" onClick={() => { if (finished) return; onAction(true); setDrift((d) => d - (12 + level)); setCorrections((c) => c + 1); }}>
          Right
        </button>
      </div>
      <p className="mt-2 text-xs text-slate-600">Use Left/Right arrow keys or buttons.</p>
    </div>
  );
}

export function GameRunner({ gameId, level = 1 }: Props) {
  const safeLevel = Math.max(1, Math.min(10, level));
  const [result, setResult] = useState<null | { score: number; accuracy: number; errors: number; duration: number }>(null);
  const addSession = useCireernStore((state) => state.addSession);
  const addAction = useCireernStore((state) => state.addAction);
  const gameType = useMemo(
    () => gameCatalog.find((g) => g.id === gameId)?.type ?? "iq",
    [gameId]
  );

  const logAction = (success: boolean) => {
    const payload = {
      gameId,
      gameType,
      success,
      level: safeLevel
    };
    addAction({
      gameId,
      success,
      at: new Date().toISOString()
    });
    void api("/games/actions", {
      method: "POST",
      body: JSON.stringify(payload)
    }).catch(() => undefined);
  };

  const finalize = (score: number, accuracy: number, errors: number, duration: number) => {
    if (result) return;
    setResult({ score, accuracy, errors, duration });
    addSession({
      gameId,
      score,
      accuracy,
      errors,
      durationSeconds: duration,
      playedAt: new Date().toISOString()
    });
    void api("/games/sessions", {
      method: "POST",
      body: JSON.stringify({
        gameId,
        gameType,
        score,
        accuracy,
        errors,
        durationSeconds: duration,
        level: safeLevel
      })
    }).catch(() => undefined);
  };

  if (result) {
    const nextLevel = Math.min(10, safeLevel + 1);
    const hasNextLevel = safeLevel < 10;
    return (
      <section className="space-y-4 rounded-2xl bg-white p-6 shadow-[var(--shadow-card)]">
        <h2 className="font-display text-2xl">Session Complete</h2>
        <p>Level Played: {safeLevel}</p>
        <p>Score: {result.score}</p>
        <p>Accuracy: {Math.round(result.accuracy * 100)}%</p>
        <p>Errors: {result.errors}</p>
        <p>XP Earned: {result.accuracy > 0.8 ? 75 : 50}</p>
        <ProgressBar value={result.accuracy * 100} />
        <div className="flex flex-wrap gap-2 pt-1">
          {hasNextLevel ? (
            <Link
              href={`/play/${gameId}?level=${nextLevel}`}
              className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white"
            >
              Next Level (L{nextLevel})
            </Link>
          ) : (
            <span className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-500">
              Max level reached
            </span>
          )}
          <Link
            href={`/play/${gameId}?level=${safeLevel}`}
            className="rounded-xl border border-[var(--cg-3d-border)] bg-white px-4 py-2 text-sm font-semibold text-cg-text"
          >
            Play Again
          </Link>
          <Link
            href="/overview?tab=reports"
            className="rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white"
          >
            Go to Reports
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl bg-white p-6 shadow-[var(--shadow-card)]">
      {["maze-navigation", "pattern-logic"].includes(gameId) ? (
        <MazeGame level={safeLevel} onAction={logAction} onFinish={finalize} />
      ) : null}
      {["memory-sequence", "focus-grid"].includes(gameId) ? (
        <MemoryGame level={safeLevel} onAction={logAction} onFinish={finalize} />
      ) : null}
      {["rhythm-tap", "reaction-lane"].includes(gameId) ? (
        <RhythmGame level={safeLevel} onAction={logAction} onFinish={finalize} />
      ) : null}
      {["balance-challenge", "stability-tracker"].includes(gameId) ? (
        <BalanceGame level={safeLevel} onAction={logAction} onFinish={finalize} />
      ) : null}
      {![
        "maze-navigation",
        "pattern-logic",
        "memory-sequence",
        "focus-grid",
        "rhythm-tap",
        "reaction-lane",
        "balance-challenge",
        "stability-tracker"
      ].includes(gameId) ? (
        <p>Game coming soon.</p>
      ) : null}
    </section>
  );
}
