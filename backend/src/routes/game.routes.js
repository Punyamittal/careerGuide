import { Router } from "express";
import { getMyGameSummary, postGameAction, postGameSession } from "../controllers/game.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { actionEventSchema, sessionEventSchema } from "../validators/game.validator.js";

const router = Router();

router.use(requireAuth);

router.get("/summary", getMyGameSummary);
router.post("/actions", validate(actionEventSchema), postGameAction);
router.post("/sessions", validate(sessionEventSchema), postGameSession);

export default router;
