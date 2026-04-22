import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const seedScript = join(root, "backend", "scripts", "seed.mjs");

const result = spawnSync(process.execPath, [seedScript], {
  stdio: "inherit",
  cwd: join(root, "backend")
});

process.exit(result.status ?? 1);
