import { getSupabaseAdmin } from "../../config/supabase.js";
import { throwClarification } from "../errors/clarification.errors.js";

export function clarificationDb() {
  return getSupabaseAdmin();
}

export function assertNoError(
  error: { message: string; code?: string } | null,
  context: string
): void {
  if (error) {
    // eslint-disable-next-line no-console
    console.error(`[clarification-db] ${context}`, error);
    throwClarification("MONGO_UNAVAILABLE", { message: error.message, context });
  }
}

export function singleRow<T>(rows: T[] | null, context: string): T {
  if (!rows?.length) {
    throwClarification("SESSION_NOT_FOUND", { context });
  }
  return rows[0];
}

export function maybeRow<T>(rows: T[] | null): T | null {
  return rows?.[0] ?? null;
}
