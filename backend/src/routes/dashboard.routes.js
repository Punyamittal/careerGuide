import { Router } from "express";
import { dashboardSummary, institutionOverview } from "../controllers/dashboard.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRoles } from "../middlewares/role.middleware.js";

const router = Router();

router.use(requireAuth);
router.get("/summary", dashboardSummary);
router.get("/institution/overview", requireRoles("admin"), institutionOverview);

export default router;
