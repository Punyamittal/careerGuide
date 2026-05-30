import type Phaser from "phaser";

/** Console diagnostics in development builds. */
export const LIKERT_DEBUG = process.env.NODE_ENV === "development";

/** On-canvas debug panel — only when URL contains ?debug=true */
export function isLikertDebugMode(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return new URLSearchParams(window.location.search).get("debug") === "true";
  } catch {
    return false;
  }
}

export function likertLog(stage: string, detail?: unknown) {
  if (!LIKERT_DEBUG) return;
  if (detail !== undefined) {
    console.log(`[Likert:${stage}]`, detail);
  } else {
    console.log(`[Likert:${stage}]`);
  }
}

export const LIKERT_FONT =
  'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

export function likertTextStyle(
  overrides: Phaser.Types.GameObjects.Text.TextStyle = {}
): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontFamily: LIKERT_FONT,
    color: "#0f172a",
    ...overrides
  };
}

export async function waitForContainerSize(
  el: HTMLElement,
  maxMs = 4000
): Promise<{ width: number; height: number }> {
  const start = Date.now();
  return new Promise((resolve) => {
    const measure = () => {
      const rect = el.getBoundingClientRect();
      const width = Math.floor(rect.width);
      const height = Math.floor(rect.height);
      if (width >= 280 && height >= 280) {
        resolve({
          width: Math.max(320, width),
          height: Math.max(400, height)
        });
        return;
      }
      if (Date.now() - start >= maxMs) {
        resolve({
          width: Math.max(320, width || 640),
          height: Math.max(400, height || 480)
        });
        return;
      }
      requestAnimationFrame(measure);
    };
    measure();
  });
}

export function stylePhaserCanvas(container: HTMLElement) {
  const canvas = container.querySelector("canvas");
  if (!canvas) return;
  canvas.style.display = "block";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.position = "relative";
  canvas.style.zIndex = "1";
}
