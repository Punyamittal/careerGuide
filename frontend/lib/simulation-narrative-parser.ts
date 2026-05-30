import type { InternshipScene, VirtualInternship } from "@/lib/virtual-internships";

export type NarrativeSpeaker = "raghav" | "dolly";

export type NarrativeStep = {
  speaker: NarrativeSpeaker;
  text: string;
};

export type NarrativeDecisionOption = {
  letter: string;
  text: string;
};

/** @deprecated Legacy multi-line scene script; prefer batch JSON. */
export type ParsedSimulationNarrative = {
  sceneTitle: string;
  context: string;
  steps: NarrativeStep[];
  decision: {
    question: string;
    options: NarrativeDecisionOption[];
  };
};

export type AtomicParseResult =
  | { kind: "line"; speaker: NarrativeSpeaker; text: string }
  | { kind: "decision"; question: string; options: NarrativeDecisionOption[] };

/** One API response: full ordered steps + decision (frontend advances locally). */
export type ParsedBatchNarrative = {
  steps: NarrativeStep[];
  decision: { question: string; options: NarrativeDecisionOption[] };
};

function normalize(raw: string): string {
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/[\u201c\u201d\u2018\u2019]/g, '"')
    .trim();
}

function stripFences(s: string): string {
  const t = s.trim();
  const m = t.match(/^```(?:\w*)?\s*([\s\S]*?)\s*```$/);
  return m ? m[1].trim() : t;
}

/** Reject legacy / noisy formats that should never reach the UI. */
function looksLikeInvalidStructure(t: string): boolean {
  if (/^\s*[\[{]/m.test(t)) return true;
  if (/^\s*Scene\s*:/im.test(t)) return true;
  if (/^\s*Context\s*:/im.test(t)) return true;
  if (/^\s*Steps\s*:/im.test(t)) return true;
  if (/^\s*Decision\s*:/im.test(t)) return true;
  if (/^\s*\[(raghav|dolly)\]/im.test(t)) return true;
  return false;
}

function parseLineOnly(t: string): { speaker: NarrativeSpeaker; text: string } | null {
  const lines = t.split("\n").map((l) => l.trim());
  let speaker: NarrativeSpeaker | null = null;
  const textParts: string[] = [];

  for (const line of lines) {
    if (!line) continue;
    const sm = line.match(/^speaker\s*:\s*(raghav|dolly)\s*$/i);
    if (sm) {
      speaker = sm[1].toLowerCase() as NarrativeSpeaker;
      continue;
    }
    const tm = line.match(/^text\s*:\s*(.*)$/i);
    if (tm) {
      textParts.push(tm[1].trim());
      continue;
    }
    if (speaker && textParts.length > 0 && !/^\w+\s*:/.test(line)) {
      textParts.push(line);
    }
  }

  const text = textParts.join(" ").trim();
  if (!speaker || !text) return null;
  return { speaker, text };
}

const OPTION_LINE = /^([A-Da-d])\.\s*(.+)$/;

function parseDecisionOnly(t: string): { question: string; options: NarrativeDecisionOption[] } | null {
  const lines = t.split("\n").map((l) => l.trim());
  const options: NarrativeDecisionOption[] = [];
  const qParts: string[] = [];
  let seenQuestion = false;

  for (const line of lines) {
    if (!line) continue;
    if (/^mode\s*:\s*decision/i.test(line)) continue;

    const om = line.match(OPTION_LINE);
    if (om) {
      options.push({ letter: om[1].toUpperCase(), text: om[2].trim() });
      continue;
    }

    const qm = line.match(/^question\s*:\s*(.*)$/i);
    if (qm) {
      seenQuestion = true;
      qParts.push(qm[1].trim());
      continue;
    }

    if (seenQuestion && options.length === 0 && !/^\w+\s*:/.test(line)) {
      qParts.push(line);
    }
  }

  const question = qParts.join(" ").trim();
  if (!question || options.length < 2) return null;
  return { question, options };
}

/**
 * Parse a single API reply: one dialogue line OR decision block.
 * Returns null if format is wrong or legacy structure is detected.
 */
export function parseAtomicAiReply(raw: string | null | undefined): AtomicParseResult | null {
  if (!raw?.trim()) return null;
  const t = stripFences(normalize(raw));
  if (looksLikeInvalidStructure(t)) return null;

  const speakerKeyLines = t.split("\n").filter((l) => /^\s*speaker\s*:/i.test(l));
  if (speakerKeyLines.length > 1) return null;

  if (/^\s*mode\s*:\s*decision/im.test(t)) {
    const d = parseDecisionOnly(t);
    if (!d) return null;
    return { kind: "decision", question: d.question, options: d.options };
  }

  const line = parseLineOnly(t);
  if (!line) return null;
  return { kind: "line", speaker: line.speaker, text: line.text };
}

export const SIMULATION_BATCH_JSON_PROMPT = `You are generating dialogue for a step-by-step cinematic simulation engine.

The frontend loads your response ONCE, then reveals one step per user click (stepIndex is local—do not simulate multiple API turns).

STRICT RULES
1. Output a COMPLETE ordered sequence in ONE response. No follow-up batches.
2. Every "text" must be unique—never repeat lines or restart the conversation from the top.
3. Alternate speakers naturally: raghav → dolly → raghav → dolly.
4. Each line: 1–2 sentences. No Scene:/Context:/Steps: prose. No [raghav] tags. JSON only.
5. Raghav: mentor—frames trade-offs, introduces concepts, does not give final answers.
6. Dolly: peer—questions, reactions, challenges assumptions.
7. End with "decision": question + options array (plain strings, 3–4 items; no "A." prefix).

OUTPUT (valid JSON only — no markdown fences, no commentary before or after)

{
  "steps": [
    { "speaker": "raghav", "text": "..." },
    { "speaker": "dolly", "text": "..." }
  ],
  "decision": {
    "question": "...",
    "options": ["...", "...", "..."]
  }
}

Repeating any line or omitting decision makes the response INVALID.`;

export function parseBatchNarrativeJson(raw: string | null | undefined): ParsedBatchNarrative | null {
  if (!raw?.trim()) return null;
  const normalized = normalize(raw);
  let slice = stripFences(normalized);
  const start = slice.indexOf("{");
  const end = slice.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  slice = slice.slice(start, end + 1);
  try {
    const data = JSON.parse(slice) as {
      steps?: unknown;
      decision?: { question?: string; options?: unknown };
    };
    if (!Array.isArray(data.steps) || data.steps.length < 2) return null;

    const steps: NarrativeStep[] = [];
    const seen = new Set<string>();
    for (const row of data.steps) {
      if (!row || typeof row !== "object") continue;
      const sp = (row as { speaker?: string }).speaker?.toLowerCase();
      const text = (row as { text?: string }).text;
      if ((sp !== "raghav" && sp !== "dolly") || typeof text !== "string") continue;
      const t = text.trim();
      if (!t || seen.has(t)) continue;
      seen.add(t);
      steps.push({ speaker: sp as NarrativeSpeaker, text: t });
    }
    if (steps.length < 2) return null;

    const d = data.decision;
    if (!d || typeof d !== "object") return null;
    const q = typeof d.question === "string" ? d.question.trim() : "";
    const options: NarrativeDecisionOption[] = [];
    if (Array.isArray(d.options)) {
      let idx = 0;
      for (const opt of d.options) {
        if (typeof opt === "string" && opt.trim()) {
          options.push({ letter: String.fromCharCode(65 + idx), text: opt.trim() });
          idx += 1;
        }
      }
    }
    if (!q || options.length < 2) return null;

    return { steps, decision: { question: q, options } };
  } catch {
    return null;
  }
}

export function buildFallbackDecision(
  scene: InternshipScene | null
): { question: string; options: NarrativeDecisionOption[] } {
  const options =
    scene?.choices.map((c, i) => ({
      letter: String.fromCharCode(65 + i),
      text: c.label
    })) ?? [
      { letter: "A", text: "Take the steadier path" },
      { letter: "B", text: "Take the bolder path" },
      { letter: "C", text: "Pause and gather one more signal" }
    ];
  return {
    question: scene
      ? "What choice matches your instinct in this moment?"
      : "What do you want to do next?",
    options
  };
}

export function buildFallbackBatchNarrative(
  sim: VirtualInternship,
  scene: InternshipScene | null,
  isIntro: boolean
): ParsedBatchNarrative {
  const steps: NarrativeStep[] = isIntro
    ? [
        {
          speaker: "raghav",
          text: `Welcome. You're stepping into ${sim.roleTitle} — we'll go one beat at a time, no grades, just how the work really feels.`
        },
        {
          speaker: "dolly",
          text: "Okay… what should I actually pay attention to first so I don't get lost?"
        },
        {
          speaker: "raghav",
          text: "Start with the tension: what users need, what the business needs, and what time allows. You don't resolve it yet—you notice it."
        },
        {
          speaker: "dolly",
          text: "So it's normal if the right move isn't obvious on day one?"
        },
        {
          speaker: "raghav",
          text: "Exactly. Uncertainty is data. When you're ready below, we'll walk a real scene from the catalog."
        }
      ]
    : [
        {
          speaker: "raghav",
          text: `We're in "${scene?.title ?? "this beat"}". ${scene ? scene.situation.slice(0, 220) + (scene.situation.length > 220 ? "…" : "") : sim.tagline}`
        },
        {
          speaker: "dolly",
          text: "What's the uncomfortable trade-off hiding in this situation—not the polite version?"
        },
        {
          speaker: "raghav",
          text: "Good instinct. Name who loses if you optimize for speed, and who loses if you optimize for certainty."
        },
        {
          speaker: "dolly",
          text: "And if I pick the 'safe' option, what story am I telling myself to feel better?"
        },
        {
          speaker: "raghav",
          text: "That's the kind of reflection that turns a simulation into real judgment. Now choose what you'd do next—not what's 'correct'."
        }
      ];

  return { steps, decision: buildFallbackDecision(scene) };
}

/** Offline fallback when the model returns unusable output. */
export function buildFallbackLine(
  sim: VirtualInternship,
  scene: InternshipScene | null,
  lineIndex: number,
  lastSpeaker: NarrativeSpeaker | null
): NarrativeStep {
  const next: NarrativeSpeaker =
    lastSpeaker === "raghav" ? "dolly" : lastSpeaker === "dolly" ? "raghav" : "raghav";
  if (lineIndex === 0) {
    return {
      speaker: "raghav",
      text: `Welcome. You're stepping into ${sim.roleTitle} — ${scene?.title ? `this moment: ${scene.title}.` : `${sim.tagline}`} Let's take it one beat at a time.`
    };
  }
  if (next === "dolly") {
    return {
      speaker: "dolly",
      text: scene
        ? "Okay—what's the part of this situation that feels least clear to you right now?"
        : "That sounds like a lot. What would you want to understand first?"
    };
  }
  return {
    speaker: "raghav",
    text: scene
      ? "Good. Hold that uncertainty—it's where good designers do their best thinking."
      : "We'll go slowly. Your job is to notice trade-offs, not to be perfect."
  };
}
