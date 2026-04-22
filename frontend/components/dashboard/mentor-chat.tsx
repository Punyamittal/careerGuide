"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

type MentorChatProps = {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  busy: boolean;
  reply: string | null;
};

const FAB_PX = 56;
const FAB_GAP = 12;
const DRAG_THRESHOLD_PX = 8;
const STORAGE_KEY = "cg_mentor_fab_pos";

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function clampFabPos(r: number, b: number) {
  if (typeof window === "undefined") return { r, b };
  const w = window.innerWidth;
  const h = window.innerHeight;
  const pad = 8;
  return {
    r: clamp(r, pad, w - FAB_PX - pad),
    b: clamp(b, pad, h - FAB_PX - pad)
  };
}

/** Career mentor: layered chat bubbles + sparkle (AI) — reads clearly at small sizes */
function MentorFabIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" aria-hidden>
      <path
        d="M5.5 15.5c0-3.6 2.9-6.5 6.5-6.5h7.5c3.6 0 6.5 2.9 6.5 6.5v4.5c0 3.6-2.9 6.5-6.5 6.5h-2.2L12 31.5v-3.5H12c-3.6 0-6.5-2.9-6.5-6.5v-4.5z"
        fill="rgb(255 255 255 / 0.2)"
        stroke="white"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M13.5 19c0-2.48 2.02-4.5 4.5-4.5h8c2.48 0 4.5 2.02 4.5 4.5v3.8c0 2.48-2.02 4.5-4.5 4.5h-2.7l-3.2 2.9v-2.9H18c-2.48 0-4.5-2.02-4.5-4.5V19z"
        fill="white"
        stroke="white"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        fill="white"
        d="M30.5 6.5l.85 2.35 2.35.35-2.35.85-.85 2.35-.85-2.35-2.35-.85 2.35-.85z"
      />
      <circle cx="19" cy="21.5" r="1.15" fill="rgb(6 95 70)" />
      <circle cx="22.5" cy="21.5" r="1.15" fill="rgb(6 95 70)" />
      <circle cx="26" cy="21.5" r="1.15" fill="rgb(6 95 70)" />
    </svg>
  );
}

type DragSession = {
  startX: number;
  startY: number;
  startR: number;
  startB: number;
  pointerId: number;
  moved: boolean;
};

export function MentorChat({ value, onChange, onSubmit, busy, reply }: MentorChatProps) {
  const [open, setOpen] = useState(false);
  const [fabPos, setFabPos] = useState({ r: 16, b: 16 });
  const [dragging, setDragging] = useState(false);
  const titleId = useId();
  const dragRef = useRef<DragSession | null>(null);
  const fabPosRef = useRef(fabPos);
  fabPosRef.current = fabPos;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw) as { r?: number; b?: number };
        if (typeof p.r === "number" && typeof p.b === "number") {
          setFabPos(clampFabPos(p.r, p.b));
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  const persistPos = useCallback((r: number, b: number) => {
    const c = clampFabPos(r, b);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
    } catch {
      /* ignore */
    }
    return c;
  }, []);

  useEffect(() => {
    const onResize = () => {
      setFabPos((prev) => clampFabPos(prev.r, prev.b));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const endFabDrag = useCallback(
    (e: React.PointerEvent, target: HTMLElement) => {
      const d = dragRef.current;
      dragRef.current = null;
      setDragging(false);
      try {
        target.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      if (!d) return;

      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;
      const nr = d.startR - dx;
      const nb = d.startB - dy;
      const final = persistPos(nr, nb);
      setFabPos(final);

      if (!d.moved) {
        setOpen(true);
      }
    },
    [persistPos]
  );

  const onFabPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startR: fabPosRef.current.r,
      startB: fabPosRef.current.b,
      pointerId: e.pointerId,
      moved: false
    };
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onFabPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const d = dragRef.current;
    if (!d || e.pointerId !== d.pointerId) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (Math.hypot(dx, dy) > DRAG_THRESHOLD_PX) d.moved = true;
    const nr = d.startR - dx;
    const nb = d.startB - dy;
    setFabPos(clampFabPos(nr, nb));
  };

  const onFabPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (dragRef.current && e.pointerId === dragRef.current.pointerId) {
      endFabDrag(e, e.currentTarget);
    }
  };

  const onFabPointerCancel = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragRef.current || e.pointerId !== dragRef.current.pointerId) return;
    dragRef.current = null;
    setDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    const cur = fabPosRef.current;
    const saved = persistPos(cur.r, cur.b);
    setFabPos(saved);
  };

  const fabStyle = {
    right: `calc(${fabPos.r}px + env(safe-area-inset-right, 0px))`,
    bottom: `calc(${fabPos.b}px + env(safe-area-inset-bottom, 0px))`
  } as const;

  const panelBottomPx = fabPos.b + FAB_PX + FAB_GAP;

  const panelStyle = {
    right: `calc(${fabPos.r}px + env(safe-area-inset-right, 0px))`,
    bottom: `calc(${panelBottomPx}px + env(safe-area-inset-bottom, 0px))`
  } as const;

  return (
    <>
      <button
        type="button"
        onPointerDown={onFabPointerDown}
        onPointerMove={onFabPointerMove}
        onPointerUp={onFabPointerUp}
        onPointerCancel={onFabPointerCancel}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className={`fixed z-[60] flex h-14 w-14 touch-none select-none items-center justify-center rounded-2xl border-2 border-[var(--cg-3d-border)] bg-emerald-700 text-white shadow-[4px_4px_0_0_var(--cg-3d-border)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-900 dark:border-emerald-300 dark:bg-emerald-600 dark:shadow-[4px_4px_0_0_rgb(0,0,0)] ${
          dragging
            ? "cursor-grabbing scale-[0.98] shadow-[3px_3px_0_0_var(--cg-3d-border)]"
            : "cursor-grab hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-emerald-600 hover:shadow-[5px_5px_0_0_var(--cg-3d-border)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[2px_2px_0_0_var(--cg-3d-border)] dark:hover:bg-emerald-500"
        }`}
        style={fabStyle}
        aria-label="Career mentor chat — drag to move, click to open"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <MentorFabIcon className="pointer-events-none h-9 w-9 shrink-0" />
      </button>

      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-[2px] dark:bg-black/55"
            aria-label="Close chat overlay"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="fixed z-[110] flex max-h-[min(85dvh,640px)] w-[min(calc(100vw-2rem),420px)] flex-col overflow-hidden rounded-2xl border-2 border-[var(--cg-3d-border)] bg-cg-card shadow-[6px_6px_0_0_var(--cg-3d-border)] dark:shadow-[6px_6px_0_0_rgb(0,0,0)]"
            style={panelStyle}
          >
            <div className="flex items-start justify-between gap-2 border-b-2 border-[var(--cg-3d-border)] bg-emerald-50/80 px-4 py-3 dark:bg-emerald-950/40">
              <div className="min-w-0">
                <h2 id={titleId} className="font-display text-base font-bold text-cg-text">
                  Career mentor
                </h2>
                <p className="mt-0.5 text-[11px] font-medium leading-snug text-cg-muted">
                  AI uses your latest scores when available (Ollama → Grok → OpenAI → fallback).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="shrink-0 rounded-lg border-2 border-[var(--cg-3d-border)] bg-white px-2.5 py-1 text-xs font-bold text-cg-text shadow-[2px_2px_0_0_var(--cg-3d-border)] transition hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
              >
                Close
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {reply ? (
                <p className="whitespace-pre-wrap rounded-xl border border-[var(--cg-3d-border)] bg-cg-accent-soft/50 p-3 text-sm leading-relaxed text-cg-text">
                  {reply}
                </p>
              ) : (
                <p className="text-sm font-medium text-cg-muted">
                  Ask about careers, streams, or how to read your results. Replies stay in this session until you send a
                  new question.
                </p>
              )}
            </div>

            <form
              onSubmit={(e) => {
                onSubmit(e);
              }}
              className="border-t-2 border-[var(--cg-3d-border)] bg-cg-card p-3"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                <input
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  placeholder="Ask a career question…"
                  className="min-h-[44px] flex-1 rounded-xl border-2 border-[var(--cg-3d-border)] bg-white px-3 py-2.5 text-sm text-cg-text outline-none ring-cg-accent/20 focus:ring-2 dark:bg-zinc-900 dark:text-zinc-100"
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="min-h-[44px] shrink-0 rounded-xl border-2 border-[var(--cg-3d-border)] bg-cg-text px-4 py-2.5 text-sm font-semibold text-white shadow-[3px_3px_0_0_var(--cg-3d-border)] transition hover:-translate-x-px hover:-translate-y-px hover:shadow-[4px_4px_0_0_var(--cg-3d-border)] disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
                >
                  {busy ? "Sending…" : "Send"}
                </button>
              </div>
            </form>
          </div>
        </>
      ) : null}
    </>
  );
}
