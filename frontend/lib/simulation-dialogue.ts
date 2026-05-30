export type SimulationSpeaker = "raghav" | "dolly";

export type SimulationDialogueMessage = {
  speaker: SimulationSpeaker;
  text: string;
};

function stripCodeFence(s: string): string {
  const t = s.trim();
  const m = t.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return m ? m[1].trim() : t;
}

/** Parse AI reply when it returns a JSON dialogue array. */
export function tryParseDialogueFromReply(reply: string | null | undefined): SimulationDialogueMessage[] | null {
  if (!reply?.trim()) return null;
  let raw = stripCodeFence(reply);
  if (!raw.startsWith("[")) {
    const i = raw.indexOf("[");
    const j = raw.lastIndexOf("]");
    if (i < 0 || j <= i) return null;
    raw = raw.slice(i, j + 1);
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    const out: SimulationDialogueMessage[] = [];
    for (const row of parsed) {
      if (!row || typeof row !== "object") continue;
      const speaker = (row as { speaker?: string }).speaker;
      const text = (row as { text?: string }).text;
      if ((speaker === "raghav" || speaker === "dolly") && typeof text === "string" && text.trim()) {
        out.push({ speaker, text: text.trim() });
      }
    }
    return out.length ? out : null;
  } catch {
    return null;
  }
}

const DOLLY_FALLBACK =
  "Okay—so if you had to pick one move first, what would it be? I'm trying to see how you'd actually start.";

/** Build alternating turns from plain narration when JSON is unavailable. */
export function buildFallbackDialogue(fullText: string): SimulationDialogueMessage[] {
  const t = fullText.trim();
  if (!t) return [];

  const blocks = t
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (blocks.length >= 2) {
    return blocks.map((text, i) => ({
      speaker: (i % 2 === 0 ? "raghav" : "dolly") as SimulationSpeaker,
      text
    }));
  }

  const sentences = t
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2);

  if (sentences.length >= 2) {
    return sentences.map((text, i) => ({
      speaker: (i % 2 === 0 ? "raghav" : "dolly") as SimulationSpeaker,
      text
    }));
  }

  const single: SimulationDialogueMessage[] = [{ speaker: "raghav", text: t }];
  if (t.length > 40) {
    single.push({ speaker: "dolly", text: DOLLY_FALLBACK });
  }
  return single;
}

export function resolveSimulationDialogue(
  aiReply: string | null | undefined,
  narratorFallback: string
): SimulationDialogueMessage[] {
  const parsed = tryParseDialogueFromReply(aiReply);
  if (parsed) return parsed;
  return buildFallbackDialogue(narratorFallback);
}

export function dialogueToVoiceText(messages: SimulationDialogueMessage[]): string {
  return messages.map((m) => m.text).join("\n\n");
}
