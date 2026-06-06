import { Router } from "express";
import {
  getBanks,
  getBankUserFlow,
  getEcosystemBank,
  getModuleBankContent,
  verifyBanks,
  getUserFlows,
  getUserFlowDetail,
  getUserFlowBlock
} from "../controllers/assessmentBank.controller.js";

const router = Router();

router.get("/assessment/banks", getBanks);
router.get("/assessment/banks/verify", verifyBanks);
router.get("/assessment/banks/ecosystem", getEcosystemBank);

router.get("/assessment/user-flows", getUserFlows);
router.get("/assessment/user-flows/:userFlow", getUserFlowDetail);
router.get(
  "/assessment/user-flows/:userFlow/phases/:phaseIndex/blocks/:blockIndex/content",
  getUserFlowBlock
);

router.get("/assessment/banks/:userFlow", getBankUserFlow);
router.get("/assessment/modules/:moduleId/content", getModuleBankContent);

export default router;
