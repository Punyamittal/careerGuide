import { Router } from "express";
import { dashboardSummary } from "../controllers/dashboard.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(requireAuth);
router.get("/summary", dashboardSummary);

export default router;
