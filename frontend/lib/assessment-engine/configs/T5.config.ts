/** T5 — Stroop reaction time (attention / inhibition) */
export const T5_CONFIG = {
  moduleId: "T5",
  engineType: "reaction_time" as const,
  title: "Reaction & Attention",
  constructs: ["ATTENTION"],
  trials: 12,
  colors: [
    { name: "red", hex: 0xe11d48, label: "RED" },
    { name: "blue", hex: 0x2563eb, label: "BLUE" },
    { name: "green", hex: 0x16a34a, label: "GREEN" },
    { name: "yellow", hex: 0xca8a04, label: "YELLOW" }
  ],
  congruentRatio: 0.5,
  minDelayMs: 800,
  maxDelayMs: 2200
};
