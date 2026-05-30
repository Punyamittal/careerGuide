import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  getAttemptOccupations,
  getBenchmark,
  getOccupation,
  postRoadmap,
  postSkillGaps,
  searchOccupations
} from "../controllers/occupational.controller.js";
import {
  attemptIdParamSchema
} from "../validators/assessment.validator.js";
import {
  benchmarkQuerySchema,
  occupationSearchQuerySchema,
  roadmapBodySchema,
  skillGapBodySchema,
  socCodeParamSchema
} from "../validators/occupational.validator.js";

const router = Router();

router.use(requireAuth);

router.get("/occupations", validate(occupationSearchQuerySchema), searchOccupations);
router.get("/occupations/:socCode", validate(socCodeParamSchema), getOccupation);

router.get(
  "/benchmarks/:socCode",
  validate(benchmarkQuerySchema),
  getBenchmark
);

router.post("/skill-gaps", validate(skillGapBodySchema), postSkillGaps);
router.post("/roadmaps", validate(roadmapBodySchema), postRoadmap);

router.get(
  "/attempts/:attemptId/occupations",
  validate(attemptIdParamSchema),
  getAttemptOccupations
);

export default router;
