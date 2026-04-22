const KEY = "cg_wishlist_titles_v1";

export function getWishlistTitles(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function setWishlistTitles(titles: string[]) {
  localStorage.setItem(KEY, JSON.stringify(titles));
}

export function addWishlistTitle(title: string) {
  const t = title.trim();
  if (!t) return;
  const cur = getWishlistTitles();
  if (cur.some((x) => x.toLowerCase() === t.toLowerCase())) return;
  setWishlistTitles([...cur, t]);
}

export function removeWishlistTitle(title: string) {
  setWishlistTitles(getWishlistTitles().filter((x) => x !== title));
}
