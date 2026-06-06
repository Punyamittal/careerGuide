/**
 * Minimal schema validation for MBS archive question banks.
 * @param {unknown} data
 * @param {{ kind: 'phase_bank' | 'flat_bank' }} opts
 */
export function validateBankSchema(data, opts) {
  const errors = [];
  if (!data || typeof data !== "object") {
    return { valid: false, errors: ["Bank must be a JSON object"] };
  }

  const bank = /** @type {Record<string, unknown>} */ (data);
  if (!bank.meta || typeof bank.meta !== "object") {
    errors.push("Missing meta object");
  }

  if (opts.kind === "flat_bank") {
    if (!Array.isArray(bank.items)) errors.push("Flat bank missing items[]");
    else {
      for (const item of bank.items) validateItem(item, errors);
    }
    return { valid: errors.length === 0, errors };
  }

  if (!Array.isArray(bank.phases)) {
    errors.push("Phase bank missing phases[]");
    return { valid: false, errors };
  }

  for (const phase of bank.phases) {
    if (!phase || typeof phase !== "object") {
      errors.push("Invalid phase entry");
      continue;
    }
    const blocks = /** @type {{ blocks?: unknown[] }} */ (phase).blocks;
    if (!Array.isArray(blocks)) {
      errors.push(`Phase "${phase.phase ?? "?"}" missing blocks[]`);
      continue;
    }
    for (const block of blocks) {
      if (!block || typeof block !== "object") continue;
      const items = /** @type {{ items?: unknown[] }} */ (block).items;
      if (Array.isArray(items)) {
        for (const item of items) validateItem(item, errors);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * @param {unknown} item
 * @param {string[]} errors
 */
function validateItem(item, errors) {
  if (!item || typeof item !== "object") {
    errors.push("Invalid item entry");
    return;
  }
  const row = /** @type {Record<string, unknown>} */ (item);
  if (!row.item_id || typeof row.item_id !== "string") {
    errors.push("Item missing item_id");
  }
  if (!row.stem || typeof row.stem !== "string") {
    errors.push(`Item ${row.item_id ?? "?"} missing stem`);
  }
}

/**
 * @param {import('./loader.js').ArchiveItem[]} items
 */
export function findDuplicateItemIds(items) {
  const seen = new Map();
  const duplicates = [];
  for (const item of items) {
    const id = item.item_id;
    if (seen.has(id)) duplicates.push(id);
    else seen.set(id, true);
  }
  return [...new Set(duplicates)];
}
