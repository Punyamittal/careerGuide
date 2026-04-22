import { Router } from "express";
import {
  generateReport,
  getReport,
  getReportForAttempt,
  listReports
} from "../controllers/report.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  attemptIdParamSchema,
  reportIdParamSchema
} from "../validators/assessment.validator.js";

const router = Router();

router.use(requireAuth);

router.get("/", listReports);
router.post("/attempts/:attemptId/generate", validate(attemptIdParamSchema), generateReport);
router.get("/attempts/:attemptId", validate(attemptIdParamSchema), getReportForAttempt);
router.get("/:id", validate(reportIdParamSchema), getReport);

export default router;
