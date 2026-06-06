/**
 * @typedef {Object} ApiSuccessEnvelope
 * @property {true} success
 * @property {unknown} data
 * @property {null} error
 */

/**
 * POST /v6/flows/user-6/sessions
 * @typedef {Object} CreateFlowSessionResponse
 * @property {string} flowSessionId
 * @property {string} currentPhase
 * @property {string[]} phases
 */

/**
 * POST /v6/session/:flowSessionId/clarify/evaluate
 * @typedef {Object} ClarifyEvaluateResponse
 * @property {string|null} clarificationSessionId
 * @property {string[]} firedRules
 * @property {Array<{ journeyId: string; name: string; priority: number; forced: boolean; itemsPlanned: { min: number; max: number }; simInjection: string[] }>} journeys
 * @property {number} maxJourneys
 * @property {boolean} canSkip
 * @property {boolean} [skipped]
 */

/**
 * GET /v6/session/:flowSessionId/clarify/next
 * @typedef {Object} ClarifyNextItemsResponse
 * @property {'items'} blockType
 * @property {string} journeyId
 * @property {string} clarificationSessionId
 * @property {number} itemsRemaining
 * @property {Array<{ itemId: string; questionType: string; stem: string; options: string[] }>} items
 */

/**
 * POST /v6/session/:flowSessionId/clarify/finalize
 * @typedef {Object} ClarifyFinalizeResponse
 * @property {Record<string, { score: number; confidence: number; band: string }>} constructScores
 * @property {'high'|'interpret_with_caution'} validityBand
 * @property {Object} clarificationSummary
 * @property {string[]} blockedConstructs
 * @property {'8'} nextPhase
 */

export const API_CONTRACT_VERSION = "clarification-v2.0.0";
