import { Router } from "express";
import authRoutes from "./auth.routes.js";
import aiRoutes from "./ai.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import gameRoutes from "./game.routes.js";
import questionRoutes from "./question.routes.js";
import reportRoutes from "./report.routes.js";
import simulationRoutes from "./simulation.routes.js";
import negotiationV2Routes from "../modules/negotiation-v2/routes/negotiationV2.routes.ts";
import testRoutes from "./test.routes.js";
import occupationalRoutes from "./occupational.routes.js";
import lifeJourneyRoutes from "./lifeJourney.routes.js";
import mbsRoutes from "./mbs.routes.js";
import clarificationRoutes from "../clarification/routes/clarification.routes.ts";
import userFlowRoutes from "../modules/clarification/routes/clarification.routes.js";
import assessmentEngineRoutes from "./assessmentEngine.routes.js";

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
router.use("/simulations", simulationRoutes);
router.use("/simulations/negotiation-v2", negotiationV2Routes);
router.use("/ai", aiRoutes);
router.use("/admin/questions", questionRoutes);
router.use("/", occupationalRoutes);
router.use("/", lifeJourneyRoutes);
router.use("/", mbsRoutes);
router.use("/", assessmentEngineRoutes);
router.use("/v6", userFlowRoutes);
router.use("/v6", clarificationRoutes);

export default router;
