import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { getSimulationSummary, recordSimulationSession } from "../services/simulation.service.js";

export const postSimulationSession = asyncHandler(async (req, res) => {
  const data = await recordSimulationSession(req.user.id, req.body);
  return sendSuccess(res, data);
});

export const getMySimulationSummary = asyncHandler(async (req, res) => {
  const data = await getSimulationSummary(req.user.id);
  return sendSuccess(res, data);
});
