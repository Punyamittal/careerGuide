export const CLARIFICATION_ERROR = {
  PHASE7_INCOMPLETE: { code: "CLAR_001", message: "Phase 7 must be complete before clarification" },
  NOT_EVALUATED: { code: "CLAR_002", message: "Clarification evaluate has not been run" },
  NEGOTIATION_BLOCKED: { code: "CLAR_003", message: "Negotiation report blocked — sim telemetry required (U12)" },
  POOL_EXHAUSTED: { code: "CLAR_004", message: "Clarification item pool exhausted for user" },
  INVALID_JOURNEY: { code: "CLAR_005", message: "Journey not assigned to this clarification session" },
  SESSION_NOT_FOUND: { code: "CLAR_006", message: "Flow or clarification session not found" },
  ALREADY_FINALIZED: { code: "CLAR_007", message: "Clarification session already finalized" },
  FEATURE_DISABLED: { code: "CLAR_008", message: "Clarification Phase 7.5 is disabled" },
  MONGO_UNAVAILABLE: { code: "CLAR_009", message: "Clarification persistence unavailable" },
  MIN_ITEMS_NOT_MET: { code: "CLAR_010", message: "Minimum clarification items not answered" }
};

export const FLOW_ID_USER_6 = "user-6";

export const FLOW_PHASES = ["0", "1", "2", "3", "4", "5", "6", "7", "7.5", "8"];

export const CLARIFICATION_STATUS = {
  EVALUATING: "evaluating",
  IN_PROGRESS: "in_progress",
  FINALIZED: "finalized",
  SKIPPED: "skipped"
};

export const FLOW_STATUS = {
  IN_PROGRESS: "in_progress",
  CLARIFICATION: "clarification",
  COMPLETED: "completed",
  ABORTED: "aborted"
};

export const DEPRECATED_J2_V1_PATTERN = /^CLAR-J2-(0[1-9]|[12][0-9]|3[0-5])$/;

export const JOURNEY_POOL_MAP = {
  J1: "J1",
  J2: "J2-V2",
  "J2-NEG": "NEG-V2",
  J3: "J3",
  J4: "J4",
  J5: "J5",
  J6: "J6",
  J7: "J7-LRN",
  J8: "J8-APT"
};

export const NEG_LIKERT_CONSTRUCTS = new Set([
  "NEG-IRR",
  "NEG-CYN",
  "NEG-GRD",
  "NEG-CON",
  "NEG-RUM",
  "NEG-SUS",
  "NEG-HOS",
  "NEG-PES",
  "NEGT"
]);

export const METHOD_WEIGHTS = {
  simulation: 1.0,
  micro_cat: 0.95,
  cat: 0.95,
  overclaiming: 0.9,
  sjt_v2_rubric: 0.88,
  sjt: 0.85,
  forced_choice: 0.82,
  ranking: 0.75,
  simulation_ref_hypothetical: 0.0,
  neg_likert_blocked: 0.0
};

export const FUSION_V3 = {
  boostCap: 0.1,
  confidenceFloor: 0.65,
  confidenceStop: 0.78,
  minItemsBeforeStop: 4,
  maxJourneysDefault: 2,
  maxJourneysExtended: 3
};
