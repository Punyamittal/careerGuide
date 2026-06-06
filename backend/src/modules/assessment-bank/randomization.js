/**
 * Fisher–Yates shuffle (mutates copy).
 * @template T
 * @param {T[]} arr
 * @param {() => number} [rng]
 */
export function shuffleArray(arr, rng = Math.random) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * @param {import('./loader.js').ArchiveItem[]} items
 * @param {{ seed?: string; limit?: number }} [opts]
 */
export function randomizeItems(items, opts = {}) {
  let pool = [...items];
  if (opts.seed) {
    let h = 0;
    for (let i = 0; i < opts.seed.length; i += 1) h = (h * 31 + opts.seed.charCodeAt(i)) >>> 0;
    const rng = () => {
      h = (h * 1664525 + 1013904223) >>> 0;
      return h / 0xffffffff;
    };
    pool = shuffleArray(pool, rng);
  } else {
    pool = shuffleArray(pool);
  }
  if (opts.limit != null && opts.limit > 0) pool = pool.slice(0, opts.limit);
  return pool;
}

/**
 * Order items for adaptive delivery based on difficulty target.
 * @param {import('./likertAdapter.js').LikertItemLike[]} items
 * @param {number} difficultyTarget 1–5
 */
export function orderForAdaptive(items, difficultyTarget = 2) {
  const scored = items.map((item) => {
    const diff = item.difficulty ?? 2;
    const tags = item.adaptiveTags ?? [];
    let bias = Math.abs(diff - difficultyTarget);
    if (tags.includes("simple") && difficultyTarget <= 2) bias -= 0.5;
    if (tags.includes("complex") && difficultyTarget >= 4) bias -= 0.5;
    if (tags.includes("ambiguous") && difficultyTarget >= 3) bias -= 0.3;
    return { item, bias };
  });
  scored.sort((a, b) => a.bias - b.bias);
  return scored.map((s) => s.item);
}
