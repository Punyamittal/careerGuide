"use client";

import { useMemo, useState } from "react";
import { useCireernStore } from "@/lib/cireern-store";
import { careerProfiles, cosineSimilarity } from "@/lib/cireern-data";

const starterPrompts = [
  "What career suits me?",
  "How do I improve my logic score?",
  "What game should I play today?"
];

export function CoachChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: "user" | "coach"; content: string }>>([
    {
      role: "coach",
      content: "Hi! I am your Career Coach. Ask me anything about your skills and next best game."
    }
  ]);
  const [draft, setDraft] = useState("");
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

  const sendMessage = (content: string) => {
    const clean = content.trim();
    if (!clean) return;
    setMessages((prev) => [
      ...prev,
      { role: "user", content: clean },
      {
        role: "coach",
        content: `${quickContext} Keep practicing with one IQ game and one physiology game today.`
      }
    ]);
    setDraft("");
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="fixed right-4 bottom-4 z-50 rounded-full bg-[var(--secondary)] px-4 py-3 text-sm font-semibold text-white shadow-lg"
      >
        Ask your Career Coach
      </button>
      {open ? (
        <div className="fixed right-4 bottom-20 z-50 h-[600px] w-[400px] max-w-[calc(100vw-2rem)] rounded-2xl bg-[var(--card)] p-4 shadow-2xl">
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
            <div className="flex gap-2">
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm"
                placeholder="Ask your question..."
              />
              <button
                type="button"
                onClick={() => sendMessage(draft)}
                className="rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
