import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { getDashboard, getInstitutionOverview } from "../services/dashboard.service.js";

export const dashboardSummary = asyncHandler(async (req, res) => {
  const data = await getDashboard(req.user.id);
  return sendSuccess(res, data);
});

export const institutionOverview = asyncHandler(async (_req, res) => {
  const data = await getInstitutionOverview();
  return sendSuccess(res, data);
});
