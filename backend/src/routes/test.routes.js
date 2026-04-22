import { Router } from "express";
import {
  getAttempt,
  getNextQuestion,
  getQuestions,
  patchIntake,
  patchResponses,
  postSubmit,
  startAttempt
} from "../controllers/test.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  attemptIdParamSchema,
  createAttemptSchema,
  getQuestionsQuerySchema,
  saveResponsesSchema
} from "../validators/assessment.validator.js";
import { patchIntakeSchema } from "../validators/intake.validator.js";

const router = Router();

router.use(requireAuth);

router.post("/attempts", validate(createAttemptSchema), startAttempt);
router.get("/attempts/:attemptId/next-question", validate(attemptIdParamSchema), getNextQuestion);
router.get("/attempts/:attemptId", validate(attemptIdParamSchema), getAttempt);
router.get("/questions", validate(getQuestionsQuerySchema), getQuestions);
router.patch("/attempts/:attemptId/intake", validate(patchIntakeSchema), patchIntake);
router.patch(
  "/attempts/:attemptId/responses",
  validate(saveResponsesSchema),
  patchResponses
);
router.post("/attempts/:attemptId/submit", validate(attemptIdParamSchema), postSubmit);

export default router;
