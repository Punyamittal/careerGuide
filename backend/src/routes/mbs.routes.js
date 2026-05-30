import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { getDomains, getOccupations, getOccupation, getRecommendations } from "../controllers/mbs.controller.js";

const router = Router();

router.get("/mbs/domains", getDomains);
router.get("/mbs/occupations", requireAuth, getOccupations);
router.get("/mbs/occupations/:socCode", requireAuth, getOccupation);
router.get("/mbs/recommendations", requireAuth, getRecommendations);

export default router;
