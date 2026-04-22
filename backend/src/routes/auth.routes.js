import { Router } from "express";
import { me, patchMe } from "../controllers/auth.controller.js";
import { USER_ROLES } from "../constants/roles.js";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireRoles } from "../middlewares/role.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { patchMeSchema } from "../validators/auth.validator.js";

const router = Router();

router.get("/me", requireAuth, me);
router.patch("/me", requireAuth, validate(patchMeSchema), patchMe);
router.get("/admin-only", requireAuth, requireRoles(USER_ROLES.ADMIN), (_req, res) => {
  return sendSuccess(res, { message: "Admin access granted" });
});

export default router;
