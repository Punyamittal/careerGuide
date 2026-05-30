import { iterateExcelChunks, col, soc } from "../excel.mjs";
import { logInfo } from "../logger.mjs";

/**
 * @param {Set<string>} validSoc
 */
export async function* streamTechnologySkills(dir, releaseId, validSoc) {
  let total = 0;
  for await (const chunk of iterateExcelChunks(dir, "Technology Skills.xlsx", 3000)) {
    const rows = [];
    for (const row of chunk) {
      const soc_code = soc(row);
      const example = String(col(row, "Example") ?? "").trim();
      if (!soc_code || !example || !validSoc.has(soc_code)) continue;
      rows.push({
        release_id: releaseId,
        soc_code,
        example,
        commodity_code: col(row, "Commodity Code") ? Number(col(row, "Commodity Code")) : null,
        commodity_title: col(row, "Commodity Title"),
        hot_technology: String(col(row, "Hot Technology") ?? "").toUpperCase() === "Y",
        in_demand: String(col(row, "In Demand") ?? "").toUpperCase() === "Y"
      });
    }
    total += rows.length;
    if (rows.length) yield rows;
  }
  logInfo(`parsed technology skills: ${total}`);
}
