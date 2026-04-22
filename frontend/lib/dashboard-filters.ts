/** Pillar filters on the dashboard Overview (aligned with dashboard-header pills). */
export type DashboardCategory = "coding" | "design" | "marketing" | "accounting";

const PATTERNS: Record<DashboardCategory, RegExp> = {
  coding:
    /software|engineer|developer|programming|\bcode\b|data\s*scientist|full[\s-]?stack|back[\s-]?end|front[\s-]?end|devops|machine learning|\bml\b|tech|computer science|aptitude|logic|verbal|algorithm|analyst|systems/i,
  design: /design|ux|ui|product designer|creative|visual|graphic|interface|figma/i,
  marketing: /market|brand|growth|seo|content|social media|campaign|sales/i,
  accounting: /account|finance|audit|tax|\bca\b|chartered|banking|commerce|economics|investment/i
};

/** Infer category tags from free text (titles, subtitles, career names). */
export function inferCategories(text: string): Set<DashboardCategory> {
  const s = new Set<DashboardCategory>();
  const t = text.trim();
  if (!t) return s;
  for (const id of Object.keys(PATTERNS) as DashboardCategory[]) {
    if (PATTERNS[id].test(t)) s.add(id);
  }
  return s;
}

function mergeTags(
  text: string,
  explicit?: readonly DashboardCategory[] | undefined
): Set<DashboardCategory> {
  const inferred = inferCategories(text);
  if (!explicit?.length) return inferred;
  return new Set([...explicit, ...inferred]);
}

export type FilterableItem = {
  title: string;
  subtitle?: string;
  meta?: string;
  filterTags?: readonly DashboardCategory[];
};

/** Returns true if the item should show under the current search + category filters. */
export function itemMatchesFilters(
  item: FilterableItem,
  query: string,
  category: DashboardCategory | null
): boolean {
  const hay = `${item.title} ${item.subtitle ?? ""} ${item.meta ?? ""}`.toLowerCase();
  const q = query.trim().toLowerCase();
  if (q && !hay.includes(q)) return false;

  if (category) {
    const tags = mergeTags(`${item.title} ${item.subtitle ?? ""} ${item.meta ?? ""}`, item.filterTags);
    if (!tags.has(category)) return false;
  }

  return true;
}
