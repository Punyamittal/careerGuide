"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useCireernStore } from "@/lib/cireern-store";
import { careerProfiles, cosineSimilarity } from "@/lib/cireern-data";
import { api } from "@/lib/api";

const starterPrompts = [
  "What career suits me?",
  "How do I improve my logic score?",
  "What game should I play today?"
];

const BUTTON_SIZE = 64;
const EDGE_MARGIN = 16;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function CoachChat() {
  const [open, setOpen] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0 });
  const [hasPosition, setHasPosition] = useState(false);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const dragStateRef = useRef<{ offsetX: number; offsetY: number; moved: boolean } | null>(null);
  const suppressClickRef = useRef(false);
  const [messages, setMessages] = useState<Array<{ role: "user" | "coach"; content: string }>>([
    {
      role: "coach",
      content: "Hi! I am your Career Coach. Ask me anything about your skills and next best game."
    }
  ]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const skills = useCireernStore((state) => state.skills);
  const topCareer = useMemo(() => {
    const vector = [
      skills.memory,
      skills.processingSpeed,
      skills.logic,
      skills.balance,
      skills.coordination,
      skills.creativity
    ];
    return careerProfiles
      .map((career) => {
        const requirement = [
          career.required.memory,
          career.required.processingSpeed,
          career.required.logic,
          career.required.balance,
          career.required.coordination,
          career.required.creativity
        ];
        return {
          name: career.name,
          matchPct: Math.round(cosineSimilarity(vector, requirement) * 100)
        };
      })
      .sort((a, b) => b.matchPct - a.matchPct)[0];
  }, [skills]);

  const quickContext = useMemo(() => {
    const strongest = Object.entries(skills).sort((a, b) => b[1] - a[1])[0];
    return `Your strongest skill is ${strongest[0]} (${strongest[1]}). Top match: ${topCareer?.name ?? "Explorer"} ${topCareer?.matchPct ?? 0}%.`;
  }, [skills, topCareer]);

  const sendMessage = async (content: string) => {
    const clean = content.trim();
    if (!clean || sending) return;
    setMessages((prev) => [...prev, { role: "user", content: clean }]);
    setDraft("");

    setSending(true);
    try {
      const response = await api<{ reply?: string; provider?: string }>("/ai/chat", {
        method: "POST",
        body: JSON.stringify({
          message: clean,
          context: {
            quickContext,
            skills
          }
        })
      });

      const reply = response.data?.reply?.trim();
      const provider = response.data?.provider;
      setMessages((prev) => [
        ...prev,
        {
          role: "coach",
          content: reply || "I could not generate a response right now. Please try again."
        },
        ...(provider ? [{ role: "coach" as const, content: `Model: ${provider}` }] : [])
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "coach",
          content: `${quickContext} Keep practicing with one IQ game and one physiology game today.`
        }
      ]);
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    const syncViewport = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setViewport({ width, height });
      if (!hasPosition) {
        setButtonPosition({
          x: width - BUTTON_SIZE - EDGE_MARGIN,
          y: height - BUTTON_SIZE - EDGE_MARGIN
        });
        setHasPosition(true);
        return;
      }
      setButtonPosition((current) => ({
        x: clamp(current.x, EDGE_MARGIN, width - BUTTON_SIZE - EDGE_MARGIN),
        y: clamp(current.y, EDGE_MARGIN, height - BUTTON_SIZE - EDGE_MARGIN)
      }));
    };

    syncViewport();
    window.addEventListener("resize", syncViewport);
    return () => window.removeEventListener("resize", syncViewport);
  }, [hasPosition]);

  const snapToClosestBorder = (x: number, y: number) => {
    const maxX = viewport.width - BUTTON_SIZE - EDGE_MARGIN;
    const maxY = viewport.height - BUTTON_SIZE - EDGE_MARGIN;
    const clampedX = clamp(x, EDGE_MARGIN, maxX);
    const clampedY = clamp(y, EDGE_MARGIN, maxY);
    const distances = [
      { side: "left", distance: Math.abs(clampedX - EDGE_MARGIN) },
      { side: "right", distance: Math.abs(maxX - clampedX) },
      { side: "top", distance: Math.abs(clampedY - EDGE_MARGIN) },
      { side: "bottom", distance: Math.abs(maxY - clampedY) }
    ];
    const nearest = distances.sort((a, b) => a.distance - b.distance)[0].side;

    if (nearest === "left") return { x: EDGE_MARGIN, y: clampedY };
    if (nearest === "right") return { x: maxX, y: clampedY };
    if (nearest === "top") return { x: clampedX, y: EDGE_MARGIN };
    return { x: clampedX, y: maxY };
  };

  const panelPosition = useMemo(() => {
    const panelWidth = Math.min(400, Math.max(viewport.width - 32, 280));
    const panelHeight = Math.min(600, Math.max(viewport.height - 112, 340));
    const idealLeft = buttonPosition.x + BUTTON_SIZE - panelWidth;
    const left = clamp(idealLeft, EDGE_MARGIN, Math.max(EDGE_MARGIN, viewport.width - panelWidth - EDGE_MARGIN));
    const topAbove = buttonPosition.y - panelHeight - 12;
    const top = topAbove > EDGE_MARGIN ? topAbove : clamp(buttonPosition.y + BUTTON_SIZE + 12, EDGE_MARGIN, viewport.height - panelHeight - EDGE_MARGIN);
    return { left, top, panelWidth, panelHeight };
  }, [buttonPosition.x, buttonPosition.y, viewport.height, viewport.width]);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (suppressClickRef.current) {
            suppressClickRef.current = false;
            return;
          }
          setOpen((prev) => !prev);
        }}
        onPointerDown={(event) => {
          dragStateRef.current = {
            offsetX: event.clientX - buttonPosition.x,
            offsetY: event.clientY - buttonPosition.y,
            moved: false
          };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!dragStateRef.current) return;
          const maxX = viewport.width - BUTTON_SIZE - EDGE_MARGIN;
          const maxY = viewport.height - BUTTON_SIZE - EDGE_MARGIN;
          const nextX = clamp(event.clientX - dragStateRef.current.offsetX, EDGE_MARGIN, maxX);
          const nextY = clamp(event.clientY - dragStateRef.current.offsetY, EDGE_MARGIN, maxY);
          const movedEnough =
            Math.abs(nextX - buttonPosition.x) > 2 || Math.abs(nextY - buttonPosition.y) > 2;
          dragStateRef.current.moved = dragStateRef.current.moved || movedEnough;
          setButtonPosition({ x: nextX, y: nextY });
        }}
        onPointerUp={(event) => {
          if (!dragStateRef.current) return;
          if (dragStateRef.current.moved) {
            suppressClickRef.current = true;
            setButtonPosition((current) => snapToClosestBorder(current.x, current.y));
          }
          dragStateRef.current = null;
          event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onPointerCancel={() => {
          dragStateRef.current = null;
        }}
        className="fixed z-50 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--secondary)] text-xs font-semibold text-white shadow-lg touch-none select-none"
        style={{ left: `${buttonPosition.x}px`, top: `${buttonPosition.y}px` }}
      >
        Coach
      </button>
      {open ? (
        <div
          className="fixed z-50 rounded-2xl bg-[var(--card)] p-4 shadow-2xl"
          style={{
            left: `${panelPosition.left}px`,
            top: `${panelPosition.top}px`,
            width: `${panelPosition.panelWidth}px`,
            height: `${panelPosition.panelHeight}px`
          }}
        >
          <div className="flex h-full flex-col gap-3">
            <h3 className="font-display text-lg text-[var(--primary)]">Career Coach</h3>
            <div className="flex-1 space-y-2 overflow-auto rounded-xl bg-[var(--background)] p-3">
              {messages.map((message, index) => (
                <p
                  key={`${message.role}-${index}`}
                  className={
                    message.role === "coach"
                      ? "rounded-xl bg-white p-2 text-sm"
                      : "rounded-xl bg-[var(--secondary)] p-2 text-sm text-white"
                  }
                >
                  {message.content}
                </p>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {starterPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendMessage(prompt)}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700"
                >
                  {prompt}
                </button>
              ))}
            </div>
            <form
              className="flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                void sendMessage(draft);
              }}
            >
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm"
                placeholder="Ask your question..."
              />
              <button
                type="submit"
                disabled={sending}
                className="rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white"
              >
                {sending ? "Sending..." : "Send"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
