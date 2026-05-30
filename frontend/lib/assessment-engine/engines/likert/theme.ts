import { prefersReducedMotion } from "./layout";

export type LikertTheme = {
  bg: number;
  surface: number;
  surfaceHover: number;
  text: string;
  textSecondary: string;
  textMuted: string;
  accent: number;
  accentSoft: number;
  accentDark: number;
  track: number;
  trackFill: number;
  border: number;
  focusRing: number;
  promptSize: string;
  titleSize: string;
  labelSize: string;
  captionSize: string;
  reducedMotion: boolean;
};

export function getLikertTheme(): LikertTheme {
  const dark =
    typeof document !== "undefined" &&
    (document.documentElement.classList.contains("dark") ||
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const reducedMotion = prefersReducedMotion();

  if (dark) {
    return {
      bg: 0x0f172a,
      surface: 0x1e293b,
      surfaceHover: 0x334155,
      text: "#f8fafc",
      textSecondary: "#cbd5e1",
      textMuted: "#94a3b8",
      accent: 0x34d399,
      accentSoft: 0x064e3b,
      accentDark: 0x10b981,
      track: 0x334155,
      trackFill: 0x10b981,
      border: 0x475569,
      focusRing: 0x6ee7b7,
      promptSize: "22px",
      titleSize: "13px",
      labelSize: "14px",
      captionSize: "12px",
      reducedMotion
    };
  }

  return {
    bg: 0xf8fafc,
    surface: 0xffffff,
    surfaceHover: 0xf1f5f9,
    text: "#0f172a",
    textSecondary: "#334155",
    textMuted: "#64748b",
    accent: 0x059669,
    accentSoft: 0xd1fae5,
    accentDark: 0x047857,
    track: 0xe2e8f0,
    trackFill: 0x10b981,
    border: 0xcbd5e1,
    focusRing: 0x34d399,
    promptSize: "22px",
    titleSize: "13px",
    labelSize: "14px",
    captionSize: "12px",
    reducedMotion
  };
}

export function themePadding(width: number) {
  return Math.max(16, Math.min(28, Math.round(width * 0.045)));
}
