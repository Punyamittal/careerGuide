import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import {
  listMbsDomains,
  searchMbsOccupations,
  getMbsOccupationBySoc
} from "../services/mbs/classification.service.js";
import { getMbsRecommendations } from "../services/mbs/recommendation.service.js";

export const getDomains = asyncHandler(async (_req, res) => {
  const domains = await listMbsDomains();
  return sendSuccess(res, { domains });
});

export const getOccupations = asyncHandler(async (req, res) => {
  const data = await searchMbsOccupations({
    mbsDomain: req.query.mbsDomain,
    careerGroup: req.query.careerGroup,
    q: req.query.q,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
    offset: req.query.offset ? Number(req.query.offset) : undefined
  });
  return sendSuccess(res, data);
});

export const getOccupation = asyncHandler(async (req, res) => {
  const occ = await getMbsOccupationBySoc(req.params.socCode);
  return sendSuccess(res, { occupation: occ });
});

export const getRecommendations = asyncHandler(async (req, res) => {
  const data = await getMbsRecommendations(req.user.id, {
    limit: req.query.limit ? Number(req.query.limit) : undefined
  });
  return sendSuccess(res, data);
});
