const KEY = "cg_settings_v1";

export type ClientSettings = {
  emailDigest: boolean;
  compactSidebarHints: boolean;
};

const defaultSettings: ClientSettings = {
  emailDigest: false,
  compactSidebarHints: false
};

export function getClientSettings(): ClientSettings {
  if (typeof window === "undefined") return { ...defaultSettings };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...defaultSettings };
    const parsed = JSON.parse(raw) as Partial<ClientSettings>;
    return { ...defaultSettings, ...parsed };
  } catch {
    return { ...defaultSettings };
  }
}

export function saveClientSettings(patch: Partial<ClientSettings>) {
  const next = { ...getClientSettings(), ...patch };
  localStorage.setItem(KEY, JSON.stringify(next));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("cg-settings-changed"));
  }
  return next;
}
