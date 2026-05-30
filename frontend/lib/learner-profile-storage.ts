const KEY = "cg_learner_profile_v1";

export type LearnerProfileLocal = {
  role: "Student" | "Parent" | null;
  ageBand: string;
};

const defaults: LearnerProfileLocal = {
  role: "Student",
  ageBand: ""
};

export function getLearnerProfile(): LearnerProfileLocal {
  if (typeof window === "undefined") return { ...defaults };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...defaults };
    const parsed = JSON.parse(raw) as Partial<LearnerProfileLocal>;
    return {
      role: parsed.role === "Parent" ? "Parent" : parsed.role === "Student" ? "Student" : defaults.role,
      ageBand: typeof parsed.ageBand === "string" ? parsed.ageBand : ""
    };
  } catch {
    return { ...defaults };
  }
}

export function saveLearnerProfile(patch: Partial<LearnerProfileLocal>) {
  const next = { ...getLearnerProfile(), ...patch };
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}
