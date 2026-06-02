/** T4 — Path tracing (coordination) */
export const T4_CONFIG = {
  moduleId: "T4",
  engineType: "tracing" as const,
  title: "Path Tracing",
  constructs: ["COORDINATION"],
  trials: 3,
  paths: [
    { id: "path-easy", difficulty: 1, points: 12 },
    { id: "path-mid", difficulty: 2, points: 16 },
    { id: "path-hard", difficulty: 3, points: 20 }
  ],
  timeLimitMs: 45000
};
