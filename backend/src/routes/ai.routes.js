import { Router } from "express";
import { postChat } from "../controllers/ai.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { chatSchema } from "../validators/assessment.validator.js";

const router = Router();

router.use(requireAuth);
router.post("/chat", validate(chatSchema), postChat);

export default router;
