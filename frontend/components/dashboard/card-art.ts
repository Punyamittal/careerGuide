/**
 * Ghibli-inspired Japanese countryside photography (Unsplash, web) — rice fields, mist, warm light, rural roads.
 * Unsplash License; decorative alt text is set where images render.
 */
export const CARD_ART = {
  /** Warm autumn, thatched roof — golden-hour mood */
  sunset:
    "https://images.unsplash.com/photo-1766201479477-e4f9b1c517b7?auto=format&fit=crop&w=720&h=450&q=85",
  /** Hillside home overlooking water — calm coast / lake */
  ocean:
    "https://images.unsplash.com/photo-1706208014761-67e7d5f87fc3?auto=format&fit=crop&w=720&h=450&q=85",
  /** Persimmons on the branch — soft organic tones */
  lavender:
    "https://images.unsplash.com/photo-1765861067975-9156551e16ea?auto=format&fit=crop&w=720&h=450&q=85",
  /** Road through green rice fields — rural Japan */
  mint:
    "https://images.unsplash.com/photo-1774156890843-d30e8b7bfca2?auto=format&fit=crop&w=720&h=450&q=85",
  /** Valley between mountains — open sky */
  coral:
    "https://images.unsplash.com/photo-1651222152488-45ae44d87dc6?auto=format&fit=crop&w=720&h=450&q=85",
  /** Misty forest — quiet, moody */
  slate:
    "https://images.unsplash.com/photo-1578554700872-ef0e27c46d37?auto=format&fit=crop&w=720&h=450&q=85"
} as const;

export type CardArtKey = keyof typeof CARD_ART;

/** “Latest learned” wide hero — rolling hills & distant town */
export const LATEST_LEARNED_HERO =
  "https://images.unsplash.com/photo-1759642688793-4fac3221b687?auto=format&fit=crop&w=960&h=480&q=85";

/** Sidebar PRO teaser — river through lush green countryside */
export const UPGRADE_GIFT_IMAGE =
  "https://images.unsplash.com/photo-1698794503338-a61fc2d1929e?auto=format&fit=crop&w=720&h=360&q=85";

/** Small progress row thumbnails — same family as cards */
export const PROGRESS_THUMB: Record<"sunset" | "ocean" | "lavender" | "mint", string> = {
  sunset: CARD_ART.sunset,
  ocean: CARD_ART.ocean,
  lavender: CARD_ART.lavender,
  mint: CARD_ART.mint
};

export function dicebearLoreleiAvatar(seed: string) {
  return `https://api.dicebear.com/7.x/lorelei/svg?seed=${encodeURIComponent(seed)}&backgroundColor=f5e9dc`;
}
