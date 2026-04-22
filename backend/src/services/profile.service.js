import { StatusCodes } from "http-status-codes";
import { getSupabaseAdmin } from "../config/supabase.js";
import { ApiError } from "../utils/ApiError.js";
import { buildUserFromProfile } from "../utils/userPayload.js";

/**
 * @param {string} userId
 * @param {{ name?: string, preferences?: Record<string, boolean> }} patch
 */
export async function updateProfile(userId, patch) {
  const supabase = getSupabaseAdmin();

  const { data: existing, error: fetchErr } = await supabase
    .from("profiles")
    .select("id, email, name, role, preferences")
    .eq("id", userId)
    .maybeSingle();

  if (fetchErr) throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, fetchErr.message);
  if (!existing) throw new ApiError(StatusCodes.NOT_FOUND, "Profile not found");

  const updates = { updated_at: new Date().toISOString() };

  if (patch.name !== undefined) {
    updates.name = patch.name.trim();
  }

  if (patch.preferences !== undefined) {
    const prev =
      existing.preferences && typeof existing.preferences === "object" && !Array.isArray(existing.preferences)
        ? existing.preferences
        : {};
    updates.preferences = { ...prev, ...patch.preferences };
  }

  const { data: row, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select("id, email, name, role, preferences")
    .single();

  if (error) {
    if (/preferences|column|does not exist/i.test(String(error.message || ""))) {
      throw new ApiError(
        StatusCodes.SERVICE_UNAVAILABLE,
        "Database missing profiles.preferences — run migration 004_profiles_preferences.sql"
      );
    }
    throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  }

  return buildUserFromProfile(row, row.email ?? "");
}
