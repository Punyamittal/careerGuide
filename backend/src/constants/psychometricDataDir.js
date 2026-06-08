import { existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Tracked psychometric banks (committed under backend/data/psychometric). */
export const PSYCHOMETRIC_DATA_DIR = join(__dirname, "../../data/psychometric");

/** Legacy local path (gitignored) — used only if committed copy missing. */
export const LEGACY_FRONTEND_DATA_DIR = join(__dirname, "../../../frontend/data");

/**
 * @param {string} filename
 */
export function resolvePsychometricDataPath(filename) {
  const committed = join(PSYCHOMETRIC_DATA_DIR, filename);
  if (existsSync(committed)) return committed;
  const legacy = join(LEGACY_FRONTEND_DATA_DIR, filename);
  if (existsSync(legacy)) return legacy;
  return committed;
}
