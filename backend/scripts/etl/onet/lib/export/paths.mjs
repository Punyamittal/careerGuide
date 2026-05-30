import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import { mkdirSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const backendRoot = resolve(__dirname, "../../../../../");
export const exportRoot = join(backendRoot, "exports", "onet");

export const ensureExportDir = () => {
  mkdirSync(exportRoot, { recursive: true });
  return exportRoot;
};

export const exportFile = (name) => join(exportRoot, name);
