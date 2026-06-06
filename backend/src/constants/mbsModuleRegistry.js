/**
 * Canonical 39-module assessment registry.
 * Product codes M1/M3/M11/M12/T4/T5 map to Phase-1 priority entries.
 */

export const ENGINE_TYPES = [
  "likert",
  "branching",
  "reaction_time",
  "tracing",
  "drag_drop",
  "node_graph"
];

export const PHASE1_MODULE_IDS = [
  "M01",
  "M02",
  "M03",
  "M04",
  "M05",
  "M06",
  "M07",
  "M08",
  "M09",
  "SS02",
  "SS03",
  "T4",
  "T5"
];

/** @type {Array<{
 *   id: string;
 *   productCode: string;
 *   title: string;
 *   engineType: string;
 *   toolkitRef: string | null;
 *   constructTags: string[];
 *   mbsDomainHints: string[];
 *   difficultyTier: string;
 *   estimatedMinutes: number;
 *   status: string;
 *   sortOrder: number;
 * }>} */
export const MBS_MODULE_REGISTRY = [
  // Phase 1 — priority (6)
  { id: "M01", productCode: "M1", title: "Maslow Motivation", engineType: "likert", toolkitRef: "M01_Maslow", constructTags: ["MASLOW"], mbsDomainHints: [], difficultyTier: "beginner", estimatedMinutes: 6, status: "beta", sortOrder: 1 },
  { id: "M03", productCode: "M3", title: "Dweck Mindset", engineType: "likert", toolkitRef: "M03_Dweck_Mindset", constructTags: ["DWECK"], mbsDomainHints: [], difficultyTier: "beginner", estimatedMinutes: 5, status: "beta", sortOrder: 2 },
  { id: "SS02", productCode: "M11", title: "Communication SJT", engineType: "branching", toolkitRef: "SS02_Communication_SJT", constructTags: ["COMMUNICATION"], mbsDomainHints: ["MBS-11", "MBS-15"], difficultyTier: "intermediate", estimatedMinutes: 8, status: "beta", sortOrder: 3 },
  { id: "SS03", productCode: "M12", title: "Collaboration SJT", engineType: "branching", toolkitRef: "SS03_Collaboration_SJT", constructTags: ["COLLABORATION"], mbsDomainHints: ["MBS-06", "MBS-15"], difficultyTier: "intermediate", estimatedMinutes: 8, status: "beta", sortOrder: 4 },
  { id: "T4", productCode: "T4", title: "Path Tracing", engineType: "tracing", toolkitRef: null, constructTags: ["COORDINATION"], mbsDomainHints: ["MBS-02"], difficultyTier: "beginner", estimatedMinutes: 4, status: "beta", sortOrder: 5 },
  { id: "T5", productCode: "T5", title: "Reaction & Attention", engineType: "reaction_time", toolkitRef: "I07_Stroop_Test", constructTags: ["ATTENTION"], mbsDomainHints: ["MBS-01", "MBS-04"], difficultyTier: "beginner", estimatedMinutes: 5, status: "beta", sortOrder: 6 },
  // Personality — Big Five core (5)
  { id: "P01", productCode: "P01", title: "Openness", engineType: "likert", toolkitRef: "P01_Big5_Openness", constructTags: ["BIG5", "OPENNESS"], mbsDomainHints: [], difficultyTier: "beginner", estimatedMinutes: 6, status: "draft", sortOrder: 10 },
  { id: "P02", productCode: "P02", title: "Conscientiousness", engineType: "likert", toolkitRef: "P02_Big5_Conscientiousness", constructTags: ["BIG5"], mbsDomainHints: [], difficultyTier: "beginner", estimatedMinutes: 6, status: "draft", sortOrder: 11 },
  { id: "P03", productCode: "P03", title: "Extraversion", engineType: "likert", toolkitRef: "P03_Big5_Extraversion", constructTags: ["BIG5"], mbsDomainHints: [], difficultyTier: "beginner", estimatedMinutes: 6, status: "draft", sortOrder: 12 },
  { id: "P04", productCode: "P04", title: "Agreeableness", engineType: "likert", toolkitRef: "P04_Big5_Agreeableness", constructTags: ["BIG5"], mbsDomainHints: [], difficultyTier: "beginner", estimatedMinutes: 6, status: "draft", sortOrder: 13 },
  { id: "P05", productCode: "P05", title: "Neuroticism", engineType: "likert", toolkitRef: "P05_Big5_Neuroticism", constructTags: ["BIG5"], mbsDomainHints: [], difficultyTier: "beginner", estimatedMinutes: 6, status: "draft", sortOrder: 14 },
  // Motivation remainder (7)
  { id: "M02", productCode: "M2", title: "McClelland Needs", engineType: "likert", toolkitRef: "M02_McClelland", constructTags: ["MCCLELLAND"], mbsDomainHints: [], difficultyTier: "intermediate", estimatedMinutes: 8, status: "beta", sortOrder: 20 },
  { id: "M04", productCode: "M4", title: "Herzberg Hygiene", engineType: "likert", toolkitRef: "M04_Herzberg", constructTags: ["HERZBERG"], mbsDomainHints: [], difficultyTier: "intermediate", estimatedMinutes: 8, status: "beta", sortOrder: 21 },
  { id: "M05", productCode: "M5", title: "Equity Theory", engineType: "likert", toolkitRef: "M05_Equity", constructTags: ["EQUITY"], mbsDomainHints: [], difficultyTier: "intermediate", estimatedMinutes: 7, status: "beta", sortOrder: 22 },
  { id: "M06", productCode: "M6", title: "Reinforcement", engineType: "likert", toolkitRef: "M06_Reinforcement", constructTags: ["REINFORCEMENT"], mbsDomainHints: [], difficultyTier: "intermediate", estimatedMinutes: 7, status: "beta", sortOrder: 23 },
  { id: "M07", productCode: "M7", title: "Attribution Style", engineType: "likert", toolkitRef: "M07_Attribution", constructTags: ["ATTRIBUTION"], mbsDomainHints: [], difficultyTier: "intermediate", estimatedMinutes: 8, status: "beta", sortOrder: 24 },
  { id: "M08", productCode: "M8", title: "Expectancy Theory", engineType: "likert", toolkitRef: "M08_Vroom_Expectancy", constructTags: ["VROOM"], mbsDomainHints: [], difficultyTier: "intermediate", estimatedMinutes: 8, status: "beta", sortOrder: 25 },
  { id: "M09", productCode: "M9", title: "Psychological Capital", engineType: "likert", toolkitRef: "M09_PsyCap", constructTags: ["PSYCAP", "GRIT"], mbsDomainHints: [], difficultyTier: "intermediate", estimatedMinutes: 8, status: "beta", sortOrder: 26 },
  // Cognitive (6)
  { id: "I01", productCode: "I01", title: "Multiple Intelligences", engineType: "likert", toolkitRef: "I01_Gardner_MI", constructTags: ["GARDNER_MI"], mbsDomainHints: [], difficultyTier: "intermediate", estimatedMinutes: 8, status: "draft", sortOrder: 30 },
  { id: "I03", productCode: "I03", title: "Pattern Matrices", engineType: "likert", toolkitRef: "I03_Raven_Matrices_Style", constructTags: ["REASONING"], mbsDomainHints: ["MBS-01"], difficultyTier: "intermediate", estimatedMinutes: 10, status: "draft", sortOrder: 31 },
  { id: "I06", productCode: "I06", title: "Cognitive Bias Bank", engineType: "branching", toolkitRef: "I06_Cognitive_Bias_Bank", constructTags: ["BIAS"], mbsDomainHints: [], difficultyTier: "advanced", estimatedMinutes: 10, status: "draft", sortOrder: 32 },
  { id: "I08", productCode: "I08", title: "Working Memory Span", engineType: "reaction_time", toolkitRef: "I08_Millers_Law", constructTags: ["MEMORY"], mbsDomainHints: [], difficultyTier: "intermediate", estimatedMinutes: 6, status: "draft", sortOrder: 33 },
  { id: "I09", productCode: "I09", title: "Verbal Reasoning", engineType: "likert", toolkitRef: "I09_Verbal_Reasoning", constructTags: ["VERBAL"], mbsDomainHints: ["MBS-11"], difficultyTier: "intermediate", estimatedMinutes: 8, status: "draft", sortOrder: 34 },
  { id: "I10", productCode: "I10", title: "Numerical Reasoning", engineType: "likert", toolkitRef: "I10_Numerical_Reasoning", constructTags: ["NUMERICAL"], mbsDomainHints: ["MBS-07"], difficultyTier: "intermediate", estimatedMinutes: 8, status: "draft", sortOrder: 35 },
  // Social skills (2)
  { id: "SS01", productCode: "SS01", title: "Self Management", engineType: "likert", toolkitRef: "SS01_Self_Management", constructTags: ["SELF_MANAGEMENT"], mbsDomainHints: [], difficultyTier: "beginner", estimatedMinutes: 6, status: "draft", sortOrder: 40 },
  { id: "SS04", productCode: "SS04", title: "Problem Solving SJT", engineType: "branching", toolkitRef: "SS04_Problem_Solving", constructTags: ["PROBLEM_SOLVING"], mbsDomainHints: ["MBS-01", "MBS-06"], difficultyTier: "intermediate", estimatedMinutes: 8, status: "draft", sortOrder: 41 },
  // Leadership (4)
  { id: "L01", productCode: "L01", title: "Transformational Leadership", engineType: "branching", toolkitRef: "L01_Transformational", constructTags: ["LEADERSHIP"], mbsDomainHints: ["MBS-06"], difficultyTier: "advanced", estimatedMinutes: 10, status: "draft", sortOrder: 50 },
  { id: "L02", productCode: "L02", title: "Transactional Leadership", engineType: "branching", toolkitRef: "L02_Transactional", constructTags: ["LEADERSHIP"], mbsDomainHints: ["MBS-06"], difficultyTier: "advanced", estimatedMinutes: 10, status: "draft", sortOrder: 51 },
  { id: "L11", productCode: "L11", title: "Katz Skills", engineType: "likert", toolkitRef: "L11_Katz_Skills", constructTags: ["LEADERSHIP"], mbsDomainHints: ["MBS-06"], difficultyTier: "advanced", estimatedMinutes: 8, status: "draft", sortOrder: 52 },
  { id: "L12", productCode: "L12", title: "Action Identification", engineType: "branching", toolkitRef: "L12_Action_Identification", constructTags: ["LEADERSHIP"], mbsDomainHints: ["MBS-06"], difficultyTier: "advanced", estimatedMinutes: 8, status: "draft", sortOrder: 53 },
  // Organisational / social lenses (4)
  { id: "OB16", productCode: "OB16", title: "Social Comparison", engineType: "likert", toolkitRef: "OB16_Social_Comparison", constructTags: ["SOCIAL_COMPARISON"], mbsDomainHints: [], difficultyTier: "intermediate", estimatedMinutes: 6, status: "draft", sortOrder: 60 },
  { id: "OB01", productCode: "OB01", title: "Leader-Member Exchange", engineType: "likert", toolkitRef: "OB01_LMX", constructTags: ["LMX"], mbsDomainHints: ["MBS-15"], difficultyTier: "intermediate", estimatedMinutes: 6, status: "draft", sortOrder: 61 },
  { id: "LR01", productCode: "LR01", title: "Learning Style Profile", engineType: "drag_drop", toolkitRef: "LR01_Learning_Style_Profile", constructTags: ["LEARNING"], mbsDomainHints: ["MBS-12"], difficultyTier: "beginner", estimatedMinutes: 7, status: "draft", sortOrder: 62 },
  { id: "W01", productCode: "W01", title: "Stress & Strain", engineType: "likert", toolkitRef: "W01_Stress_Strain", constructTags: ["WELLBEING"], mbsDomainHints: ["MBS-16"], difficultyTier: "beginner", estimatedMinutes: 5, status: "draft", sortOrder: 63 },
  // Life narrative (4)
  { id: "LEN01", productCode: "LEN01", title: "Gestalt Lens", engineType: "likert", toolkitRef: "LEN01_Gestalt", constructTags: ["NARRATIVE"], mbsDomainHints: [], difficultyTier: "intermediate", estimatedMinutes: 7, status: "draft", sortOrder: 70 },
  { id: "LEN02", productCode: "LEN02", title: "Lewin BPE", engineType: "likert", toolkitRef: "LEN02_Lewin_BPE", constructTags: ["LEWIN_BPE"], mbsDomainHints: [], difficultyTier: "intermediate", estimatedMinutes: 7, status: "draft", sortOrder: 71 },
  { id: "LEN03", productCode: "LEN03", title: "Sense & Meaning", engineType: "likert", toolkitRef: "LEN03_Sense_Meaning", constructTags: ["SENSE_MEANING"], mbsDomainHints: ["MBS-20"], difficultyTier: "intermediate", estimatedMinutes: 7, status: "draft", sortOrder: 72 },
  { id: "LEN04", productCode: "LEN04", title: "Reinforcement Lens", engineType: "likert", toolkitRef: "LEN04_Reinforcement_Lens", constructTags: ["NARRATIVE"], mbsDomainHints: [], difficultyTier: "intermediate", estimatedMinutes: 7, status: "draft", sortOrder: 73 },
  { id: "SC01", productCode: "SC01", title: "Strategic Agency", engineType: "branching", toolkitRef: "SC01_Agency", constructTags: ["STRATEGY"], mbsDomainHints: ["MBS-06"], difficultyTier: "advanced", estimatedMinutes: 10, status: "draft", sortOrder: 74 },
  { id: "ECO01", productCode: "ECO01", title: "Ecosystem Knowledge 2026", engineType: "likert", toolkitRef: null, constructTags: ["ECO-SECTOR", "ECOSYSTEM"], mbsDomainHints: ["MBS-07"], difficultyTier: "intermediate", estimatedMinutes: 12, status: "beta", sortOrder: 75 }
];

export function getModuleById(id) {
  return MBS_MODULE_REGISTRY.find((m) => m.id === id || m.productCode === id);
}

export function listLiveModules() {
  return MBS_MODULE_REGISTRY.filter((m) => m.status === "live" || m.status === "beta");
}
