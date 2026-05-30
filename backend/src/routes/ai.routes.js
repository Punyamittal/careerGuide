import { Router } from "express";
import { postAdaptiveCareerQuizNext, postChat } from "../controllers/ai.controller.js";
import { optionalAuth, requireAuth } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { adaptiveCareerQuizNextSchema, chatSchema } from "../validators/assessment.validator.js";

const router = Router();

/** Signed-in users get latest assessment context; guests use client `context` only. */
router.post("/chat", optionalAuth, validate(chatSchema), postChat);

router.use(requireAuth);
router.post("/career-quiz/next", validate(adaptiveCareerQuizNextSchema), postAdaptiveCareerQuizNext);

export default router;
