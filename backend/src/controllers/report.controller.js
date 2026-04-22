import { StatusCodes } from "http-status-codes";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import {
  generateReportForAttempt,
  getReportByAttempt,
  getReportById,
  listReportsForUser
} from "../services/report.service.js";

export const generateReport = asyncHandler(async (req, res) => {
  const { report, created } = await generateReportForAttempt({
    userId: req.user.id,
    attemptId: req.params.attemptId
  });
  return sendSuccess(res, { report }, created ? StatusCodes.CREATED : StatusCodes.OK);
});

export const getReport = asyncHandler(async (req, res) => {
  const report = await getReportById(req.params.id, req.user.id);
  return sendSuccess(res, { report });
});

export const getReportForAttempt = asyncHandler(async (req, res) => {
  const report = await getReportByAttempt(req.params.attemptId, req.user.id);
  return sendSuccess(res, { report });
});

export const listReports = asyncHandler(async (req, res) => {
  const reports = await listReportsForUser(req.user.id);
  return sendSuccess(res, { reports });
});
