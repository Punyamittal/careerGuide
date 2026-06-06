import { Router } from "express";
import {
  getBanks,
  getBankUserFlow,
  getEcosystemBank,
  getModuleBankContent,
  verifyBanks
} from "../controllers/assessmentBank.controller.js";

const router = Router();

router.get("/assessment/banks", getBanks);
router.get("/assessment/banks/verify", verifyBanks);
router.get("/assessment/banks/ecosystem", getEcosystemBank);
router.get("/assessment/banks/:userFlow", getBankUserFlow);
router.get("/assessment/modules/:moduleId/content", getModuleBankContent);

export default router;
