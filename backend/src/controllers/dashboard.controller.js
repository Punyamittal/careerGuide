import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { getDashboard } from "../services/dashboard.service.js";

export const dashboardSummary = asyncHandler(async (req, res) => {
  const data = await getDashboard(req.user.id);
  return sendSuccess(res, data);
});
