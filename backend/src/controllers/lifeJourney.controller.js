import { StatusCodes } from "http-status-codes";
import {
  createLifeJourneyEvent,
  deleteLifeJourneyEvent,
  listLifeJourneyEvents
} from "../services/lifeJourney.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getLifeJourneyEvents = asyncHandler(async (req, res) => {
  const events = await listLifeJourneyEvents(req.user.id);
  res.status(StatusCodes.OK).json({ success: true, data: { events }, error: null });
});

export const postLifeJourneyEvent = asyncHandler(async (req, res) => {
  const event = await createLifeJourneyEvent(req.user.id, req.body);
  res.status(StatusCodes.CREATED).json({ success: true, data: { event }, error: null });
});

export const removeLifeJourneyEvent = asyncHandler(async (req, res) => {
  await deleteLifeJourneyEvent(req.user.id, req.params.eventId);
  res.status(StatusCodes.OK).json({ success: true, data: null, error: null });
});
