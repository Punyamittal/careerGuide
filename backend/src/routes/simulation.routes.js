import { Router } from "express";
import { getMySimulationSummary, postSimulationSession } from "../controllers/simulation.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { simulationSessionSchema } from "../validators/simulation.validator.js";

const router = Router();

router.use(requireAuth);

router.get("/summary", getMySimulationSummary);
router.post("/sessions", validate(simulationSessionSchema), postSimulationSession);

export default router;
