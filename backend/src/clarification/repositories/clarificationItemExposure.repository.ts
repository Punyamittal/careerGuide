import { assertNoError, clarificationDb } from "./base.repository.js";

const MAX_EXPOSURE = 3;

export async function listExhaustedItemIds(userId: string): Promise<string[]> {
  const { data, error } = await clarificationDb()
    .from("clarification_item_exposure")
    .select("item_id")
    .eq("user_id", userId)
    .gte("exposure_count", MAX_EXPOSURE);

  assertNoError(error, "listExhaustedItemIds");
  return (data ?? []).map((row: { item_id: string }) => String(row.item_id));
}

export async function incrementItemExposure(userId: string, itemId: string): Promise<void> {
  const { data: existing, error: fetchError } = await clarificationDb()
    .from("clarification_item_exposure")
    .select("exposure_count")
    .eq("user_id", userId)
    .eq("item_id", itemId)
    .maybeSingle();

  assertNoError(fetchError, "incrementItemExposure.fetch");

  const exposureCount = (existing?.exposure_count ?? 0) + 1;
  const now = new Date().toISOString();

  const { error } = await clarificationDb()
    .from("clarification_item_exposure")
    .upsert(
      {
        user_id: userId,
        item_id: itemId,
        exposure_count: exposureCount,
        last_exposed_at: now
      },
      { onConflict: "user_id,item_id" }
    );

  assertNoError(error, "incrementItemExposure.upsert");
}

export { MAX_EXPOSURE };
