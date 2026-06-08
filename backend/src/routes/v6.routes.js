import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  clarificationErrorHandler,
  requireClarificationFeature,
  requireMongo
} from "../modules/clarification/middleware/clarification.middleware.js";
import {
  createFlowSessionSchema,
  flowSessionIdParams,
  updateFlowPhaseSchema
} from "../modules/clarification/validators/clarification.validator.js";
import {
  getFlowSessionState,
  patchFlowPhase,
  postFlowSession
} from "../modules/clarification/controllers/clarification.controller.js";
import {
  clarifyNextQuerySchema,
  clarifyResponseBodySchema,
  clarifySimCompleteBodySchema,
  flowSessionIdParamsSchema
} from "../clarification/validators/clarify.validator.js";
import {
  getClarifyNext,
  postClarifyEvaluate,
  postClarifyFinalize,
  postClarifyResponse,
  postClarifySimComplete
} from "../clarification/controllers/clarification.controller.ts";

const router = Router();

router.use(requireAuth);
router.use(requireClarificationFeature);
router.use(requireMongo);

/** User Flow 6 orchestrator (phases 0 → 7.5 → 8) */
router.post("/flows/user-6/sessions", validate(createFlowSessionSchema), postFlowSession);

router.get(
  "/flows/user-6/sessions/:flowSessionId/state",
  validate(flowSessionIdParams),
  getFlowSessionState
);

router.patch(
  "/flows/user-6/sessions/:flowSessionId/phase",
  validate(updateFlowPhaseSchema),
  patchFlowPhase
);

/** Phase 7.5 clarification engine */
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
