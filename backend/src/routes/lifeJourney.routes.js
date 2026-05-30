import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  getLifeJourneyEvents,
  postLifeJourneyEvent,
  removeLifeJourneyEvent
} from "../controllers/lifeJourney.controller.js";
import {
  createLifeJourneyEventSchema,
  lifeJourneyEventIdSchema
} from "../validators/lifeJourney.validator.js";

const router = Router();

router.use(requireAuth);

router.get("/life-journey/events", getLifeJourneyEvents);
router.post("/life-journey/events", validate(createLifeJourneyEventSchema), postLifeJourneyEvent);
router.delete(
  "/life-journey/events/:eventId",
  validate(lifeJourneyEventIdSchema),
  removeLifeJourneyEvent
);

export default router;
