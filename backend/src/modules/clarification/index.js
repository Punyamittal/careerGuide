/**
 * Clarification Phase 7.5 — User Flow 6
 * @module clarification
 */

export { default as clarificationRoutes } from "./routes/clarification.routes.js";
export { default as userFlowRoutes } from "./routes/userFlow.routes.js";
export { connectMongo } from "../../config/mongodb.js";
export { evaluateAmbiguityRules } from "./services/ruleEngine.service.js";
export { selectJourneys } from "./services/journeySelector.service.js";
export { routeClarificationNext } from "./services/router.service.js";
export { loadQuestionBatch } from "./services/questionLoader.service.js";
export { fuseConstructScoresV3 } from "./services/fusionV3.service.js";
