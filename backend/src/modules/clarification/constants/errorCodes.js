import { CLARIFICATION_ERROR } from "./clarification.constants.js";

/**
 * @param {keyof typeof CLARIFICATION_ERROR} key
 * @param {Record<string, unknown>} [details]
 */
export function clarificationError(key, details = {}) {
  const def = CLARIFICATION_ERROR[key];
  const err = new Error(def.message);
  err.code = def.code;
  err.details = details;
  err.name = "ClarificationError";
  return err;
}

/**
 * @param {Error & { code?: string; details?: unknown }} err
 * @returns {number}
 */
export function clarificationStatusCode(err) {
  const map = {
    CLAR_001: 409,
    CLAR_002: 409,
    CLAR_003: 422,
    CLAR_004: 503,
    CLAR_005: 400,
    CLAR_006: 404,
    CLAR_007: 409,
    CLAR_008: 503,
    CLAR_009: 503,
    CLAR_010: 400
  };
  return map[err.code] ?? 500;
}
