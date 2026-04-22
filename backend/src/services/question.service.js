import { StatusCodes } from "http-status-codes";
import { bodyToQuestionInsert, bodyToQuestionPatch, mapQuestionRow } from "../db/mappers.js";
import { getSupabaseAdmin } from "../config/supabase.js";
import { ApiError } from "../utils/ApiError.js";

export const createQuestion = async (payload) => {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("questions")
    .insert(bodyToQuestionInsert(payload))
    .select("*")
    .single();

  if (error) throw new ApiError(StatusCodes.BAD_REQUEST, error.message);
  return mapQuestionRow(data);
};

export const updateQuestion = async (id, payload) => {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("questions")
    .update(bodyToQuestionPatch(payload))
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) throw new ApiError(StatusCodes.BAD_REQUEST, error.message);
  if (!data) throw new ApiError(StatusCodes.NOT_FOUND, "Question not found");
  return mapQuestionRow(data);
};

export const deleteQuestion = async (id) => {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("questions").delete().eq("id", id);
  if (error) throw new ApiError(StatusCodes.BAD_REQUEST, error.message);
};

export const listQuestions = async ({ category, active }) => {
  const supabase = getSupabaseAdmin();
  let q = supabase.from("questions").select("*").order("category", { ascending: true }).order("sort_order", { ascending: true });

  if (category) q = q.eq("category", category);
  if (active !== undefined && active !== null && active !== "") {
    const isActive = active === true || active === "true";
    q = q.eq("active", isActive);
  }

  const { data, error } = await q;
  if (error) throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  return (data ?? []).map(mapQuestionRow);
};

export const getQuestionById = async (id) => {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("questions").select("*").eq("id", id).maybeSingle();

  if (error) throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, error.message);
  if (!data) throw new ApiError(StatusCodes.NOT_FOUND, "Question not found");
  return mapQuestionRow(data);
};
