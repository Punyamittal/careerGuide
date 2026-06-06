import { api } from "@/lib/api";
import type { ModuleConfig } from "./configs/module-config.types";

export type ModuleBankContent = {
  moduleId: string;
  engineType: string;
  source: "archive" | "static_fallback" | "procedural";
  config: ModuleConfig | null;
  itemCount: number;
  bankVersion: string | null;
  archiveItemIds?: string[];
};

export type BankListResponse = {
  version: string;
  globalItemCount: number;
  userFlows: Array<{
    key: string;
    userFlow: string;
    label: string;
    file: string;
    itemCount: number;
  }>;
  ecosystem: { itemCount: number };
};

export async function fetchModuleBankContent(
  moduleId: string,
  opts?: { shuffle?: boolean; seed?: string; userFlow?: string; adaptiveDifficulty?: number }
): Promise<ModuleBankContent | null> {
  const params = new URLSearchParams();
  if (opts?.shuffle) params.set("shuffle", "true");
  if (opts?.seed) params.set("seed", opts.seed);
  if (opts?.userFlow) params.set("userFlow", opts.userFlow);
  if (opts?.adaptiveDifficulty != null) {
    params.set("adaptiveDifficulty", String(opts.adaptiveDifficulty));
  }

  const qs = params.toString();
  const path = `/assessment/modules/${encodeURIComponent(moduleId)}/content${qs ? `?${qs}` : ""}`;

  try {
    const res = await api<ModuleBankContent>(path);
    return res.data ?? null;
  } catch {
    return null;
  }
}

export async function fetchBankCatalog(): Promise<BankListResponse | null> {
  try {
    const res = await api<BankListResponse>("/assessment/banks");
    return res.data ?? null;
  } catch {
    return null;
  }
}
