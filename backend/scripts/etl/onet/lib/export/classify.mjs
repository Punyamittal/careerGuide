import { normalizeTitle } from "./domain.mjs";

const ARCHIVE_TITLE_PATTERNS = [
  /\ball other\b/i,
  /\bnot elsewhere classified\b/i,
  /\bn\.e\.c\.\b/i
];

/**
 * Classified = production-accepted occupations (RIASEC vector present, unique SOC/title).
 * Matches occupationMatching.service filter: occupations used in career matching.
 *
 * @param {object[]} occupations
 * @param {Set<string>} riasecSocSet
 */
export const classifyOccupations = (occupations, riasecSocSet) => {
  const accepted = [];
  const discarded = [];
  const seenSoc = new Set();
  const seenTitle = new Set();
  const duplicateRemovals = [];

  const sorted = [...occupations].sort((a, b) =>
    String(a.title || "").localeCompare(String(b.title || ""), "en", { sensitivity: "base" })
  );

  for (const occ of sorted) {
    const soc = String(occ.soc_code || "").trim();
    const title = String(occ.title || "").trim();
    const normTitle = normalizeTitle(title);
    const reasons = [];

    if (!soc || !title) reasons.push("missing_identifiers");
    if (!riasecSocSet.has(soc)) reasons.push("no_riasec_vector");
    if (seenSoc.has(soc)) reasons.push("duplicate_soc");
    if (normTitle && seenTitle.has(normTitle)) reasons.push("duplicate_title");
    if (ARCHIVE_TITLE_PATTERNS.some((re) => re.test(title))) {
      reasons.push("archived_catch_all_title");
    }

    if (reasons.length) {
      discarded.push({
        soc_code: soc,
        title,
        discard_reasons: reasons
      });
      if (reasons.includes("duplicate_soc") || reasons.includes("duplicate_title")) {
        duplicateRemovals.push({ soc_code: soc, title, reasons });
      }
      continue;
    }

    seenSoc.add(soc);
    seenTitle.add(normTitle);
    accepted.push({ ...occ, classification_status: "accepted" });
  }

  return {
    accepted,
    discarded,
    acceptedSocSet: seenSoc,
    duplicateRemovals
  };
};
