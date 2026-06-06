import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  clarificationErrorHandler,
  requireClarificationFeature,
  requireMongo
} from "../middleware/clarification.middleware.js";
import {
  clarifyNextQuerySchema,
  clarifyResponseBodySchema,
  clarifySimCompleteBodySchema,
  flowSessionIdParamsSchema
} from "../validators/clarify.validator.js";
import {
  getClarifyNext,
  postClarifyEvaluate,
  postClarifyFinalize,
  postClarifyResponse,
  postClarifySimComplete
} from "../controllers/clarification.controller.js";

const router = Router();

router.use(requireAuth);
router.use(requireClarificationFeature);
router.use(requireMongo);

router.post(
  "/session/:flowSessionId/clarify/evaluate",
  validate(flowSessionIdParamsSchema),
  postClarifyEvaluate
);

router.get(
  "/session/:flowSessionId/clarify/next",
  validate(clarifyNextQuerySchema),
  getClarifyNext
);

router.post(
  "/session/:flowSessionId/clarify/response",
  validate(clarifyResponseBodySchema),
  postClarifyResponse
);

router.post(
  "/session/:flowSessionId/clarify/sim/complete",
  validate(clarifySimCompleteBodySchema),
  postClarifySimComplete
);

router.post(
  "/session/:flowSessionId/clarify/finalize",
  validate(flowSessionIdParamsSchema),
  postClarifyFinalize
);

router.use(clarificationErrorHandler);

export default router;
