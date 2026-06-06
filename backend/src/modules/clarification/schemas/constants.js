/** MongoDB collection names — single source of truth for migrations and models. */
export const COLLECTIONS = {
  USER_FLOW_SESSIONS: "user_flow_sessions",
  CLARIFICATION_SESSIONS: "clarification_sessions",
  CLARIFICATION_RESPONSES: "clarification_responses",
  CLARIFICATION_SIM_RESULTS: "clarification_sim_results",
  CLARIFICATION_ITEM_EXPOSURE: "clarification_item_exposure"
};

export const MIGRATION_COLLECTION = "schema_migrations";

export const JOURNEY_IDS = ["J1", "J2", "J2-NEG", "J3", "J4", "J5", "J6", "J7", "J8"];

export const AMBIGUITY_RULE_IDS = Array.from({ length: 17 }, (_, i) => `U${i + 1}`);

export const JOURNEY_PROGRESS_STATUS = ["pending", "active", "completed"];

export const VALIDITY_BANDS = ["high", "interpret_with_caution"];

export const CONFLICT_BRANCH_STYLES = [
  "compete",
  "collaborate",
  "avoid",
  "accommodate",
  "compromise"
];

/** Max item exposures before U16 pool rotation (V2 spec). */
export const MAX_ITEM_EXPOSURE = 3;
