import { iterateExcelChunks, col, soc } from "../excel.mjs";
import { logInfo } from "../logger.mjs";

/**
 * @param {string} dir
 * @param {string} releaseId
 * @param {Set<string>} validSoc
 * @returns {AsyncGenerator<object[]>}
 */
export async function* streamAlternateTitles(dir, releaseId, validSoc) {
  let total = 0;
  for await (const chunk of iterateExcelChunks(dir, "Alternate Titles.xlsx", 3000)) {
    const rows = [];
    for (const row of chunk) {
      const soc_code = soc(row);
      const title = String(col(row, "Alternate Title", "Title") ?? "").trim();
      if (!soc_code || !title || !validSoc.has(soc_code)) continue;
      rows.push({
        release_id: releaseId,
        soc_code,
        title,
        short_title: col(row, "Short Title"),
        source_type: col(row, "Source(s)", "Source")
      });
    }
    total += rows.length;
    if (rows.length) yield rows;
  }
  logInfo(`parsed alternate titles: ${total}`);
}
