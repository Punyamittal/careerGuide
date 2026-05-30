import type { ModuleConfig } from "./module-config.types";
import { M1_CONFIG } from "./M1.config";
import { M2_CONFIG } from "./M2.config";
import { M3_CONFIG } from "./M3.config";
import { M4_CONFIG } from "./M4.config";
import { M5_CONFIG } from "./M5.config";
import { M6_CONFIG } from "./M6.config";
import { M7_CONFIG } from "./M7.config";
import { M8_CONFIG } from "./M8.config";
import { M9_CONFIG } from "./M9.config";
import { M11_CONFIG } from "./M11.config";
import { M12_CONFIG } from "./M12.config";

const REGISTRY: Record<string, ModuleConfig> = {
  M01: M1_CONFIG,
  M1: M1_CONFIG,
  M02: M2_CONFIG,
  M2: M2_CONFIG,
  M03: M3_CONFIG,
  M3: M3_CONFIG,
  M04: M4_CONFIG,
  M4: M4_CONFIG,
  M05: M5_CONFIG,
  M5: M5_CONFIG,
  M06: M6_CONFIG,
  M6: M6_CONFIG,
  M07: M7_CONFIG,
  M7: M7_CONFIG,
  M08: M8_CONFIG,
  M8: M8_CONFIG,
  M09: M9_CONFIG,
  M9: M9_CONFIG,
  SS02: M11_CONFIG,
  M11: M11_CONFIG,
  SS03: M12_CONFIG,
  M12: M12_CONFIG
};

const ALIASES: Record<string, string> = {
  M1: "M01",
  M2: "M02",
  M3: "M03",
  M4: "M04",
  M5: "M05",
  M6: "M06",
  M7: "M07",
  M8: "M08",
  M9: "M09",
  M11: "SS02",
  M12: "SS03"
};

/** Normalize product codes (M1, M11) and registry ids (M01, SS02). */
export function normalizeModuleConfigKey(moduleId: string): string {
  const id = moduleId.trim().toUpperCase();
  return ALIASES[id] ?? id;
}

export async function loadModuleConfig(moduleId: string): Promise<ModuleConfig> {
  const key = normalizeModuleConfigKey(moduleId);
  const config = REGISTRY[key] ?? REGISTRY[moduleId.trim().toUpperCase()];
  if (config) return config;

  throw new Error(`No module config registered for "${moduleId}"`);
}

export function listRegisteredConfigIds(): string[] {
  return [...new Set(Object.values(REGISTRY).map((c) => c.moduleId))];
}

export function hasModuleConfig(moduleId: string): boolean {
  const key = normalizeModuleConfigKey(moduleId);
  return Boolean(REGISTRY[key] ?? REGISTRY[moduleId.trim().toUpperCase()]);
}
