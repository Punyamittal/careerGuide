import { themePadding } from "./theme";

export type LikertZones = {
  header: { top: number; height: number };
  question: { top: number; height: number };
  answer: { top: number; height: number };
  footer: { top: number; height: number };
};

export type LikertLayout = {
  width: number;
  height: number;
  pad: number;
  contentWidth: number;
  contentLeft: number;
  centerX: number;
  zones: LikertZones;
  mobile: boolean;
  reducedMotion: boolean;
};

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Relative zone layout — no fixed pixel positions for content. */
export function computeLikertLayout(
  width: number,
  height: number,
  promptLength = 80
): LikertLayout {
  const w = Math.max(320, Math.floor(width));
  const h = Math.max(400, Math.floor(height));
  const pad = themePadding(w);
  const mobile = w < 480;
  const reducedMotion = prefersReducedMotion();

  const headerH = Math.round(Math.min(88, Math.max(64, h * 0.12)));
  const footerH = Math.round(Math.min(72, Math.max(52, h * 0.1)));
  const promptLines = Math.min(6, Math.ceil(promptLength / (mobile ? 28 : 42)));
  const questionH = Math.round(
    Math.min(h * 0.42, Math.max(h * 0.28, 72 + promptLines * (mobile ? 26 : 30)))
  );
  const answerH = h - headerH - questionH - footerH;

  const contentWidth = Math.min(mobile ? w - pad * 2 : 560, w - pad * 2);
  const contentLeft = (w - contentWidth) / 2;

  return {
    width: w,
    height: h,
    pad,
    contentWidth,
    contentLeft,
    centerX: w / 2,
    mobile,
    reducedMotion,
    zones: {
      header: { top: 0, height: headerH },
      question: { top: headerH, height: questionH },
      answer: { top: headerH + questionH, height: answerH },
      footer: { top: headerH + questionH + answerH, height: footerH }
    }
  };
}

export function zoneCenterY(zone: { top: number; height: number }) {
  return zone.top + zone.height / 2;
}
