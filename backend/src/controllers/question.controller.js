import { StatusCodes } from "http-status-codes";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import {
  createQuestion,
  deleteQuestion,
  listQuestions,
  updateQuestion
} from "../services/question.service.js";

export const listQuestionsHandler = asyncHandler(async (req, res) => {
  const items = await listQuestions({
    category: req.query.category,
    active: req.query.active
  });
  return sendSuccess(res, { questions: items });
});

export const createQuestionHandler = asyncHandler(async (req, res) => {
  const q = await createQuestion(req.body);
  return sendSuccess(res, { question: q }, StatusCodes.CREATED);
});

export const updateQuestionHandler = asyncHandler(async (req, res) => {
  const q = await updateQuestion(req.params.id, req.body);
  return sendSuccess(res, { question: q });
});

export const deleteQuestionHandler = asyncHandler(async (req, res) => {
  await deleteQuestion(req.params.id);
  return sendSuccess(res, { deleted: true });
});
