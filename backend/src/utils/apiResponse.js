import { StatusCodes } from "http-status-codes";

/**
 * Standard success envelope: { success: true, data, error: null }
 * @param {import("express").Response} res
 * @param {unknown} [data]
 * @param {number} [statusCode=200]
 */
export function sendSuccess(res, data = null, statusCode = StatusCodes.OK) {
  return res.status(statusCode).json({
    success: true,
    data,
    error: null
  });
}
