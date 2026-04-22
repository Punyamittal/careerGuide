import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { updateProfile } from "../services/profile.service.js";

export const me = asyncHandler(async (req, res) => {
  return sendSuccess(res, { user: req.user });
});

export const patchMe = asyncHandler(async (req, res) => {
  const user = await updateProfile(req.user.id, {
    name: req.body.name,
    preferences: req.body.preferences
  });
  return sendSuccess(res, { user });
});
