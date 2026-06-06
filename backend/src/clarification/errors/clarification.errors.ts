import { StatusCodes } from "http-status-codes";
import {
  CLARIFICATION_ERROR,
  type ClarificationErrorCode
} from "../constants/clarification.constants.js";

export class ClarificationError extends Error {
  readonly code: string;
  readonly details: Record<string, unknown>;

  constructor(key: ClarificationErrorCode, details: Record<string, unknown> = {}) {
    const def = CLARIFICATION_ERROR[key];
    super(def.message);
    this.name = "ClarificationError";
    this.code = def.code;
    this.details = details;
  }
}

const STATUS_BY_CODE: Record<string, number> = {
  CLAR_001: StatusCodes.CONFLICT,
  CLAR_002: StatusCodes.CONFLICT,
  CLAR_003: StatusCodes.UNPROCESSABLE_ENTITY,
  CLAR_004: StatusCodes.SERVICE_UNAVAILABLE,
  CLAR_005: StatusCodes.BAD_REQUEST,
  CLAR_006: StatusCodes.NOT_FOUND,
  CLAR_007: StatusCodes.CONFLICT,
  CLAR_008: StatusCodes.SERVICE_UNAVAILABLE,
  CLAR_009: StatusCodes.SERVICE_UNAVAILABLE,
  CLAR_010: StatusCodes.BAD_REQUEST,
  CLAR_011: StatusCodes.BAD_REQUEST
};

export function clarificationStatusCode(err: ClarificationError): number {
  return STATUS_BY_CODE[err.code] ?? StatusCodes.INTERNAL_SERVER_ERROR;
}

export function throwClarification(
  key: ClarificationErrorCode,
  details: Record<string, unknown> = {}
): never {
  throw new ClarificationError(key, details);
}
