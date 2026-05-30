import { StatusCodes } from "http-status-codes";
import { getSupabaseAdmin } from "../config/supabase.js";
import { ApiError } from "../utils/ApiError.js";

const TABLE = "life_journey_events";

function assertNoDbError(error, fallback) {
  if (error) {
    throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, error.message || fallback);
  }
}

export const listLifeJourneyEvents = async (userId) => {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  assertNoDbError(error, "Failed to load life journey events");
  return (data ?? []).map(rowToClient);
};

export const createLifeJourneyEvent = async (userId, body) => {
  const supabase = getSupabaseAdmin();
  const payload = {
    user_id: userId,
    life_stage: body.lifeStage,
    event_type: body.eventType,
    domain: body.domain,
    subcategory: body.subcategory,
    event_label: body.eventLabel,
    custom_event: Boolean(body.customEvent),
    impacts: body.impacts ?? [],
    intensity: body.intensity,
    emotions: body.emotions ?? [],
    reflection_lens: body.reflectionLens,
    signal_map: body.signalMap ?? [],
    notes: body.notes ?? null
  };
  const { data, error } = await supabase.from(TABLE).insert(payload).select("*").single();
  assertNoDbError(error, "Failed to save life journey event");
  return rowToClient(data);
};

export const deleteLifeJourneyEvent = async (userId, eventId) => {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from(TABLE).delete().eq("user_id", userId).eq("id", eventId);
  assertNoDbError(error, "Failed to delete life journey event");
};

const rowToClient = (row) => ({
  id: row.id,
  userId: row.user_id,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  lifeStage: row.life_stage,
  eventType: row.event_type,
  domain: row.domain,
  subcategory: row.subcategory,
  eventLabel: row.event_label,
  customEvent: row.custom_event,
  impacts: row.impacts,
  intensity: row.intensity,
  emotions: row.emotions,
  reflectionLens: row.reflection_lens,
  signalMap: row.signal_map,
  notes: row.notes
});
