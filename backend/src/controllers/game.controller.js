import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { getGameSummary, recordGameAction, recordGameSession } from "../services/game.service.js";

export const postGameAction = asyncHandler(async (req, res) => {
  const data = await recordGameAction(req.user.id, req.body);
  return sendSuccess(res, data);
});

export const postGameSession = asyncHandler(async (req, res) => {
  const data = await recordGameSession(req.user.id, req.body);
  return sendSuccess(res, data);
});

export const getMyGameSummary = asyncHandler(async (req, res) => {
  const data = await getGameSummary(req.user.id);
  return sendSuccess(res, data);
});
