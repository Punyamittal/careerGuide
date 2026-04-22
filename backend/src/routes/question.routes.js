import { Router } from "express";
import { USER_ROLES } from "../constants/roles.js";
import {
  createQuestionHandler,
  deleteQuestionHandler,
  listQuestionsHandler,
  updateQuestionHandler
} from "../controllers/question.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRoles } from "../middlewares/role.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createQuestionSchema,
  questionIdParamSchema,
  updateQuestionSchema
} from "../validators/assessment.validator.js";

const router = Router();

router.use(requireAuth);
router.use(requireRoles(USER_ROLES.ADMIN));

router.get("/", listQuestionsHandler);
router.post("/", validate(createQuestionSchema), createQuestionHandler);
router.patch("/:id", validate(updateQuestionSchema), updateQuestionHandler);
router.delete("/:id", validate(questionIdParamSchema), deleteQuestionHandler);

export default router;
