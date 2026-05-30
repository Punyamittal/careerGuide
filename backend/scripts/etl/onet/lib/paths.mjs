import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Repo root: backend/scripts/etl/onet/lib → ../../../../.. */
export const repoRoot = resolve(__dirname, "../../../../..");

export const resolveReleaseDir = (releaseLabel, explicitPath) => {
  if (explicitPath) return resolve(explicitPath);
  return join(repoRoot, "data", "onet", releaseLabel);
};

export const requireReleaseDir = (releaseLabel, explicitPath) => {
  const dir = resolveReleaseDir(releaseLabel, explicitPath);
  if (!existsSync(dir)) {
    throw new Error(`Release directory not found: ${dir}`);
  }
  return dir;
};
