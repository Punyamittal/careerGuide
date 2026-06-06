export { COLLECTIONS, MIGRATION_COLLECTION, MAX_ITEM_EXPOSURE } from "./constants.js";
export * from "./validators.js";
export * from "./shared.schema.js";
export {
  createUserFlowSessionSchema,
  userFlowSessionSchemaDefinition,
  userFlowSessionIndexes
} from "./userFlowSession.schema.js";
export {
  createClarificationSessionSchema,
  clarificationSessionSchemaDefinition,
  clarificationSessionIndexes
} from "./clarificationSession.schema.js";
export {
  createClarificationResponseSchema,
  clarificationResponseSchemaDefinition,
  clarificationResponseIndexes
} from "./clarificationResponse.schema.js";
export {
  createClarificationSimResultSchema,
  clarificationSimResultSchemaDefinition,
  clarificationSimResultIndexes
} from "./clarificationSimResult.schema.js";
export {
  createClarificationItemExposureSchema,
  clarificationItemExposureSchemaDefinition,
  clarificationItemExposureIndexes
} from "./clarificationItemExposure.schema.js";

export const ALL_CLARIFICATION_INDEXES = {
  user_flow_sessions: () =>
    import("./userFlowSession.schema.js").then((m) => m.userFlowSessionIndexes),
  clarification_sessions: () =>
    import("./clarificationSession.schema.js").then((m) => m.clarificationSessionIndexes),
  clarification_responses: () =>
    import("./clarificationResponse.schema.js").then((m) => m.clarificationResponseIndexes),
  clarification_sim_results: () =>
    import("./clarificationSimResult.schema.js").then((m) => m.clarificationSimResultIndexes),
  clarification_item_exposure: () =>
    import("./clarificationItemExposure.schema.js").then((m) => m.clarificationItemExposureIndexes)
};
