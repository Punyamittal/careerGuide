import { iterateExcelChunks, col, soc } from "../excel.mjs";
import { logInfo } from "../logger.mjs";

/**
 * @param {Set<string>} validSoc
 */
export async function* streamRelatedOccupations(dir, releaseId, validSoc) {
  let total = 0;
  for await (const chunk of iterateExcelChunks(dir, "Related Occupations.xlsx", 3000)) {
    const rows = [];
    for (const row of chunk) {
      const soc_code = soc(row);
      const related_soc_code = String(col(row, "Related O*NET-SOC Code") ?? "").trim();
      if (!soc_code || !related_soc_code || !validSoc.has(soc_code)) continue;
      rows.push({
        release_id: releaseId,
        soc_code,
        related_soc_code,
        related_title: col(row, "Related Title"),
        relatedness_tier: col(row, "Relatedness Tier"),
        match_index: Number(col(row, "Index")) || null
      });
    }
    total += rows.length;
    if (rows.length) yield rows;
  }
  logInfo(`parsed related occupations: ${total}`);
}
