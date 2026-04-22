import { Router } from "express";
import authRoutes from "./auth.routes.js";
import aiRoutes from "./ai.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import gameRoutes from "./game.routes.js";
import questionRoutes from "./question.routes.js";
import reportRoutes from "./report.routes.js";
import testRoutes from "./test.routes.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    data: { status: "ok" },
    error: null
  });
});

router.use("/auth", authRoutes);
router.use("/tests", testRoutes);
router.use("/reports", reportRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/games", gameRoutes);
router.use("/ai", aiRoutes);
router.use("/admin/questions", questionRoutes);

export default router;
