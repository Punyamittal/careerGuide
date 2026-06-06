import { Router } from "express";
import { requireAuth } from "../../../middlewares/auth.middleware.js";
import { validate } from "../../../middlewares/validate.middleware.js";
import {
  postAction,
  postComplete,
  postStartSession,
  getSession
} from "../controllers/negotiationV2.controller.js";
import {
  actionBodySchema,
  sessionIdParamsSchema,
  startSessionSchema
} from "../validators/negotiationV2.validator.js";

const router = Router();

router.use(requireAuth);

router.post("/sessions", validate(startSessionSchema), postStartSession);
router.get("/sessions/:sessionId", validate(sessionIdParamsSchema), getSession);
router.post("/sessions/:sessionId/actions", validate(actionBodySchema), postAction);
router.post("/sessions/:sessionId/complete", validate(sessionIdParamsSchema), postComplete);

export default router;
