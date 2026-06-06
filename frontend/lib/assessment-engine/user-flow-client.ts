import { api } from "@/lib/api";

export type UserFlowSummary = {
  key: string;
  userFlow: string;
  label: string;
  grade: string;
  user: string;
  durationMin: number | null;
  targetItems: number | null;
  selectedItems: number | null;
  purpose: string | null;
  delivery: string | null;
  phaseCount: number;
};

export type UserFlowBlock = {
  blockIndex: number;
  blockKey: string;
  moduleId: string;
  phase: string;
  block: string;
  format: string;
  pool: string | null;
  gameModule: string | null;
  targetCount: number;
  itemIds: string[];
  itemsResolved: number;
  itemsRenderable: number;
  missingIds: string[];
  deliveryType: "items" | "game" | "narrative" | "intake" | "clarification" | "placeholder";
  adaptive: string | null;
  antiBias: string | null;
  playable: boolean;
};

export type UserFlowPhase = {
  phaseIndex: number;
  phase: string;
  blocks: UserFlowBlock[];
};

export type UserFlowDetail = {
  key: string;
  userFlow: string;
  label: string;
  grade: string;
  user: string;
  purpose: string;
  delivery: string;
  durationMin: number;
  targetItems: number;
  adaptiveRules: Record<string, unknown> | null;
  biasControls: Record<string, unknown> | null;
  report: string | null;
  phases: UserFlowPhase[];
  stats: {
    totalBlocks: number;
    playableBlocks: number;
    gameBlocks: number;
    clarificationBlocks: number;
    missingItemRefs: number;
  };
};

export async function fetchUserFlows(): Promise<UserFlowSummary[]> {
  const res = await api<{ flows: UserFlowSummary[] }>("/assessment/user-flows");
  return res.data?.flows ?? [];
}

export async function fetchUserFlow(userFlow: string): Promise<UserFlowDetail | null> {
  const res = await api<{ flow: UserFlowDetail }>(
    `/assessment/user-flows/${encodeURIComponent(userFlow)}`
  );
  return res.data?.flow ?? null;
}

export function userFlowHref(userFlow: string): string {
  return `/user-flow/${normalizeUserFlowParam(userFlow)}`;
}

export function resolveUserFlowFromTrack(track: string): string {
  return normalizeUserFlowParam(TRACK_TO_USER_FLOW[track] ?? track);
}

/** Map legacy school track keys → archive user flows */
export const TRACK_TO_USER_FLOW: Record<string, string> = {
  early_g5: "user-1",
  middle_g8: "user-2",
  stream_g910: "user-3",
  career_g11: "user-4",
  undergraduate: "user-5",
  intern: "user-6"
};

export function normalizeUserFlowParam(raw: string): string {
  const s = raw.trim().toLowerCase();
  if (TRACK_TO_USER_FLOW[s]) return TRACK_TO_USER_FLOW[s];
  if (/^user-\d+$/.test(s)) return s;
  if (/^user\d+$/.test(s)) return s.replace(/^user(\d+)$/, "user-$1");
  return s;
}
