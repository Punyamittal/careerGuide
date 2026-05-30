import { iterateExcelChunks, col, soc } from "../excel.mjs";
import { ensureElement } from "./elements.mjs";
import { recordImForProfile } from "../profile-v1-mapping.mjs";
import { SCALE } from "../constants.mjs";
import { logInfo } from "../logger.mjs";

const VALID_SCALES = new Set([SCALE.IMPORTANCE, SCALE.LEVEL, SCALE.OCCUPATIONAL_INTERESTS]);

/**
 * @typedef {object} RatingsParseContext
 * @property {string} releaseId
 * @property {Map<string, object>} elementSet
 * @property {Set<string>} validSoc
 * @property {Map<string, { elementName: string, value: number }[]>} interestsBySoc
 * @property {Map<string, object>} profileAccum
 */

/**
 * Pass 1: register elements only (FK must exist before ratings insert).
 * @param {string} dir
 * @param {{ file: string, domain: string }[]} ratingFiles
 * @param {RatingsParseContext} ctx
 */
export const scanElementsFromRatingFiles = async (dir, ratingFiles, ctx) => {
  for (const spec of ratingFiles) {
    for await (const chunk of iterateExcelChunks(dir, spec.file, 3000)) {
      for (const row of chunk) {
        const element_id = String(col(row, "Element ID") ?? "").trim();
        const scale_id = String(col(row, "Scale ID") ?? "").trim();
        if (!element_id || !VALID_SCALES.has(scale_id)) continue;
        const element_name = String(col(row, "Element Name") ?? "").trim();
        ensureElement(ctx.elementSet, ctx.releaseId, element_id, element_name, spec.domain);
      }
    }
    logInfo(`element scan complete: ${spec.file}`);
  }
};

/**
 * Pass 2: stream rating rows for DB insert.
 * @param {string} dir
 * @param {{ file: string, domain: string }} spec
 * @param {RatingsParseContext} ctx
 * @returns {AsyncGenerator<object[]>}
 */
export async function* streamRatingsFile(dir, spec, ctx) {
  const { releaseId, elementSet, validSoc, interestsBySoc, profileAccum } = ctx;
  let total = 0;
  let skipped = 0;

  for await (const chunk of iterateExcelChunks(dir, spec.file, 2500)) {
    const rows = [];
    for (const row of chunk) {
      const soc_code = soc(row);
      const element_id = String(col(row, "Element ID") ?? "").trim();
      const scale_id = String(col(row, "Scale ID") ?? "").trim();
      const rawVal = col(row, "Data Value");

      if (!soc_code || !element_id || !scale_id || rawVal === null || rawVal === "") {
        skipped += 1;
        continue;
      }
      if (!validSoc.has(soc_code)) {
        skipped += 1;
        continue;
      }
      if (!VALID_SCALES.has(scale_id)) {
        skipped += 1;
        continue;
      }

      const element_name = String(col(row, "Element Name") ?? "").trim();
      ensureElement(elementSet, releaseId, element_id, element_name, spec.domain);

      const data_value = Number(rawVal);
      if (!Number.isFinite(data_value)) {
        skipped += 1;
        continue;
      }

      if (spec.domain === "interest" && scale_id === SCALE.OCCUPATIONAL_INTERESTS) {
        if (!interestsBySoc.has(soc_code)) interestsBySoc.set(soc_code, []);
        interestsBySoc.get(soc_code).push({
          elementName: element_name || element_id,
          value: data_value
        });
      }

      if (
        scale_id === SCALE.IMPORTANCE &&
        ["ability", "knowledge", "skill", "work_style"].includes(spec.domain)
      ) {
        recordImForProfile(profileAccum, soc_code, element_name, data_value);
      }

      rows.push({
        release_id: releaseId,
        soc_code,
        element_id,
        element_name,
        scale_id,
        scale_name: col(row, "Scale Name"),
        data_value,
        domain_source: col(row, "Domain Source")
      });
    }
    total += rows.length;
    if (rows.length) yield rows;
  }

  logInfo(`ratings ${spec.file}: ${total} rows (skipped ${skipped})`);
}
