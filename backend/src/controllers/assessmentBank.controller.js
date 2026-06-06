import { StatusCodes } from "http-status-codes";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import {
  listBanks,
  getBankByUserFlow,
  getEcosystemItems,
  getModuleContent,
  runVerification,
  listUserFlows,
  getUserFlow,
  getFlowBlockContent,
  runUserFlowVerification
} from "../services/assessmentBank.service.js";

export const getBanks = asyncHandler(async (_req, res) => {
  return sendSuccess(res, listBanks());
});

export const getBankUserFlow = asyncHandler(async (req, res) => {
  const bank = getBankByUserFlow(req.params.userFlow);
  if (!bank) throw new ApiError(StatusCodes.NOT_FOUND, "User flow bank not found");
  return sendSuccess(res, { bank });
});

export const getEcosystemBank = asyncHandler(async (_req, res) => {
  return sendSuccess(res, { bank: getEcosystemItems() });
});

export const getModuleBankContent = asyncHandler(async (req, res) => {
  const shuffle = req.query.shuffle === "true" || req.query.shuffle === "1";
  const seed = typeof req.query.seed === "string" ? req.query.seed : undefined;
  const userFlow = typeof req.query.userFlow === "string" ? req.query.userFlow : undefined;
  const adaptiveDifficulty =
    req.query.adaptiveDifficulty != null ? Number(req.query.adaptiveDifficulty) : undefined;
  const limit = req.query.limit != null ? Number(req.query.limit) : undefined;

  const content = getModuleContent(req.params.moduleId, {
    shuffle,
    seed,
    userFlow,
    adaptiveDifficulty,
    limit
  });

  if (!content) throw new ApiError(StatusCodes.NOT_FOUND, "Module not found");
  return sendSuccess(res, content);
});

export const verifyBanks = asyncHandler(async (_req, res) => {
  const report = runVerification();
  const userFlows = runUserFlowVerification();
  return sendSuccess(res, { report, userFlows });
});

export const getUserFlows = asyncHandler(async (_req, res) => {
  return sendSuccess(res, listUserFlows());
});

export const getUserFlowDetail = asyncHandler(async (req, res) => {
  const flow = getUserFlow(req.params.userFlow);
  if (!flow) throw new ApiError(StatusCodes.NOT_FOUND, "User flow not found");
  return sendSuccess(res, { flow });
});

export const getUserFlowBlock = asyncHandler(async (req, res) => {
  const phaseIndex = Number(req.params.phaseIndex);
  const blockIndex = Number(req.params.blockIndex);
  const content = getFlowBlockContent(req.params.userFlow, phaseIndex, blockIndex);
  if (!content) throw new ApiError(StatusCodes.NOT_FOUND, "Flow block not found");
  return sendSuccess(res, content);
});
