import { Router } from "express";
import { requireAuth } from "../../../middlewares/auth.middleware.js";
import { validate } from "../../../middlewares/validate.middleware.js";
import {
  requireClarificationFeature,
  requireMongo
} from "../middleware/clarification.middleware.js";
import {
  createFlowSessionSchema,
  flowSessionIdParams,
  updateFlowPhaseSchema
} from "../validators/clarification.validator.js";
import {
  getFlowSessionState,
  patchFlowPhase,
  postFlowSession
} from "../controllers/clarification.controller.js";

const router = Router();

router.use(requireAuth);
router.use(requireClarificationFeature);
router.use(requireMongo);

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

export default router;
