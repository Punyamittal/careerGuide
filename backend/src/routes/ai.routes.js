import { Router } from "express";
import { postAdaptiveCareerQuizNext, postChat } from "../controllers/ai.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { adaptiveCareerQuizNextSchema, chatSchema } from "../validators/assessment.validator.js";

const router = Router();

router.use(requireAuth);
router.post("/chat", validate(chatSchema), postChat);
router.post("/career-quiz/next", validate(adaptiveCareerQuizNextSchema), postAdaptiveCareerQuizNext);

export default router;
