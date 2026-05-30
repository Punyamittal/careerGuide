import type { AssessmentModule, EngineType } from "./types";

/** Phase-1 priority — mirrors backend mbsModuleRegistry.js */
export const PHASE1_PRODUCT_CODES = [
  "M1",
  "M2",
  "M3",
  "M4",
  "M5",
  "M6",
  "M7",
  "M8",
  "M9",
  "M11",
  "M12",
  "T4",
  "T5"
] as const;

export const ENGINE_SCENE_MAP: Record<EngineType, string> = {
  likert: "LikertScene",
  branching: "BranchingScene",
  reaction_time: "ReactionTimeScene",
  tracing: "TracingScene",
  drag_drop: "DragDropScene",
  node_graph: "NodeGraphScene"
};

/** M-series motivation / SJT modules (M1–M12). */
export function isMotivationModule(m: AssessmentModule): boolean {
  if (/^M0[1-9]$/i.test(m.id)) return true;
  if (/^M(0?[1-9]|1[0-2])$/i.test(m.productCode)) return true;
  if (m.id === "SS02" || m.id === "SS03") return true;
  return false;
}

export function listMotivationModules(modules: AssessmentModule[]): AssessmentModule[] {
  return modules
    .filter(isMotivationModule)
    .sort((a, b) => {
      const order = (m: AssessmentModule) => {
        const pc = m.productCode.toUpperCase();
        const num = parseInt(pc.replace(/^M0?/, ""), 10);
        return Number.isFinite(num) ? num : 99;
      };
      return order(a) - order(b);
    });
}

/** Client-side fallback until API modules load */
export const MODULE_REGISTRY_STUB: AssessmentModule[] = [
  { id: "M01", productCode: "M1", title: "Motivation Profile", engineType: "likert", constructTags: ["MASLOW"], mbsDomainHints: [], difficultyTier: "beginner", estimatedMinutes: 12, status: "beta" },
  { id: "M02", productCode: "M2", title: "McClelland Needs", engineType: "likert", constructTags: ["MCCLELLAND"], mbsDomainHints: [], difficultyTier: "intermediate", estimatedMinutes: 8, status: "beta" },
  { id: "M03", productCode: "M3", title: "Dweck Mindset", engineType: "likert", constructTags: ["DWECK"], mbsDomainHints: [], difficultyTier: "beginner", estimatedMinutes: 5, status: "beta" },
  { id: "M04", productCode: "M4", title: "Herzberg Hygiene", engineType: "likert", constructTags: ["HERZBERG"], mbsDomainHints: [], difficultyTier: "intermediate", estimatedMinutes: 8, status: "beta" },
  { id: "M05", productCode: "M5", title: "Equity Theory", engineType: "likert", constructTags: ["EQUITY"], mbsDomainHints: [], difficultyTier: "intermediate", estimatedMinutes: 7, status: "beta" },
  { id: "M06", productCode: "M6", title: "Reinforcement", engineType: "likert", constructTags: ["REINFORCEMENT"], mbsDomainHints: [], difficultyTier: "intermediate", estimatedMinutes: 7, status: "beta" },
  { id: "M07", productCode: "M7", title: "Attribution Style", engineType: "likert", constructTags: ["ATTRIBUTION"], mbsDomainHints: [], difficultyTier: "intermediate", estimatedMinutes: 8, status: "beta" },
  { id: "M08", productCode: "M8", title: "Expectancy Theory", engineType: "likert", constructTags: ["VROOM"], mbsDomainHints: [], difficultyTier: "intermediate", estimatedMinutes: 8, status: "beta" },
  { id: "M09", productCode: "M9", title: "Psychological Capital", engineType: "likert", constructTags: ["PSYCAP"], mbsDomainHints: [], difficultyTier: "intermediate", estimatedMinutes: 8, status: "beta" },
  { id: "SS02", productCode: "M11", title: "Communication SJT", engineType: "branching", constructTags: ["COMMUNICATION"], mbsDomainHints: ["MBS-11"], difficultyTier: "intermediate", estimatedMinutes: 8, status: "beta" },
  { id: "SS03", productCode: "M12", title: "Collaboration SJT", engineType: "branching", constructTags: ["COLLABORATION"], mbsDomainHints: ["MBS-15"], difficultyTier: "intermediate", estimatedMinutes: 8, status: "beta" },
  { id: "T4", productCode: "T4", title: "Path Tracing", engineType: "tracing", constructTags: ["COORDINATION"], mbsDomainHints: ["MBS-02"], difficultyTier: "beginner", estimatedMinutes: 4, status: "beta" },
  { id: "T5", productCode: "T5", title: "Reaction & Attention", engineType: "reaction_time", constructTags: ["ATTENTION"], mbsDomainHints: ["MBS-01"], difficultyTier: "beginner", estimatedMinutes: 5, status: "beta" }
];

export function resolveModule(modules: AssessmentModule[], idOrCode: string) {
  return modules.find((m) => m.id === idOrCode || m.productCode === idOrCode);
}

export function modulesByEngine(modules: AssessmentModule[]) {
  return modules.reduce<Record<EngineType, AssessmentModule[]>>(
    (acc, m) => {
      (acc[m.engineType] ??= []).push(m);
      return acc;
    },
    {} as Record<EngineType, AssessmentModule[]>
  );
}
