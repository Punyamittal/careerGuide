import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import {
  getModules,
  getModule,
  postSession,
  postTelemetry,
  postScore
} from "../controllers/assessmentEngine.controller.js";

const router = Router();

router.get("/assessment/modules", getModules);
router.get("/assessment/modules/:moduleId", getModule);
router.use(requireAuth);
router.post("/assessment/sessions", postSession);
router.post("/assessment/sessions/:sessionId/telemetry", postTelemetry);
router.post("/assessment/sessions/:sessionId/score", postScore);

export default router;
