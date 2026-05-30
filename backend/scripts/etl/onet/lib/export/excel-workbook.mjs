import ExcelJS from "exceljs";
import { exportFile } from "./paths.mjs";
import {
  buildMasterCombinedRows,
  buildAllRatingsCombinedRows,
  buildSupportingCombinedRows,
  MASTER_COMBINED_COLUMNS,
  RATINGS_COMBINED_COLUMNS,
  SUPPORTING_COMBINED_COLUMNS
} from "./excel-combined.mjs";

const HEADER_FILL = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF1F4E79" }
};
const HEADER_FONT = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
const ALT_FILL = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF2F6FA" } };

/**
 * @param {Record<string, unknown>[]} rows
 * @param {string[]} columns
 */
const rowsToAoA = (rows, columns) => {
  const header = columns;
  const body = rows.map((r) => columns.map((c) => normalizeCell(r[c])));
  return [header, ...body];
};

const normalizeCell = (v) => {
  if (v === null || v === undefined) return null;
  if (typeof v === "object") return JSON.stringify(v);
  return v;
};

/**
 * @param {ExcelJS.Worksheet} sheet
 * @param {string[][]} aoa
 */
const applySheetFormatting = (sheet, aoa) => {
  if (!aoa.length) return;
  sheet.addRows(aoa);
  const colCount = aoa[0].length;
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: colCount }
  };

  const headerRow = sheet.getRow(1);
  headerRow.font = HEADER_FONT;
  headerRow.fill = HEADER_FILL;
  headerRow.alignment = { vertical: "middle", horizontal: "center" };

  for (let r = 2; r <= sheet.rowCount; r += 1) {
    const row = sheet.getRow(r);
    row.font = { size: 10 };
    if (r % 2 === 0) {
      row.eachCell((cell) => {
        cell.fill = ALT_FILL;
      });
    }
  }

  for (let c = 1; c <= colCount; c += 1) {
    let max = 12;
    sheet.getColumn(c).eachCell({ includeEmpty: false }, (cell) => {
      const len = String(cell.value ?? "").length;
      if (len > max) max = Math.min(len + 2, 48);
    });
    sheet.getColumn(c).width = max;
  }
};

const addDataSheet = (workbook, name, rows, columns) => {
  const sheet = workbook.addWorksheet(name.slice(0, 31));
  const aoa = rowsToAoA(rows, columns);
  applySheetFormatting(sheet, aoa);
  return sheet;
};

const flattenOccupations = (rows) =>
  rows.map((o) => ({
    soc_code: o.soc_code,
    title: o.title,
    description: o.description,
    job_zone: o.job_zone,
    bright_outlook: o.bright_outlook,
    green_occupation: o.green_occupation,
    median_salary: o.median_salary,
    classification_status: o.classification_status,
    holland_codes: Array.isArray(o.holland_codes) ? o.holland_codes.join(", ") : null
  }));

const flattenValidation = (report) => {
  const rows = [];
  for (const [field, count] of Object.entries(report.missing_fields ?? {})) {
    rows.push({ metric: `missing_${field}`, value: count });
  }
  for (const [key, val] of Object.entries(report.null_value_counts ?? {})) {
    rows.push({ metric: `null_${key}`, value: val });
  }
  rows.push({ metric: "classified_accepted", value: report.totals?.classified_accepted });
  rows.push({ metric: "discarded_removed", value: report.totals?.discarded_removed });
  rows.push({ metric: "duplicate_removals", value: report.totals?.duplicate_removals });
  rows.push({ metric: "orphaned_related", value: report.orphaned_relationships?.related_occupations });
  return rows;
};

const flattenSummary = (summary) => {
  const rows = [];
  const walk = (obj, prefix = "") => {
    for (const [k, v] of Object.entries(obj)) {
      const key = prefix ? `${prefix}.${k}` : k;
      if (v && typeof v === "object" && !Array.isArray(v)) walk(v, key);
      else rows.push({ metric: key, value: v });
    }
  };
  walk(summary);
  return rows;
};

const buildCombinedData = (datasets) => ({
  masterCombined: buildMasterCombinedRows(datasets),
  ratingsCombined: buildAllRatingsCombinedRows(datasets),
  supportingCombined: buildSupportingCombinedRows(datasets)
});

const addCombinedSheets = (workbook, combined) => {
  addDataSheet(workbook, "Combined_Master", combined.masterCombined, MASTER_COMBINED_COLUMNS);
  addDataSheet(workbook, "Combined_All_Ratings", combined.ratingsCombined, RATINGS_COMBINED_COLUMNS);
  addDataSheet(workbook, "Combined_Supporting", combined.supportingCombined, SUPPORTING_COMBINED_COLUMNS);
};

/**
 * @param {object} payload
 */
export const writeExcelWorkbook = async (payload) => {
  const {
    meta,
    datasets,
    validation,
    summary,
    outputPath = exportFile("ONET_Classified_Occupations.xlsx"),
    combinedOnlyPath = exportFile("ONET_Classified_Occupations_Combined.xlsx")
  } = payload;

  const combined = buildCombinedData(datasets);

  const combinedWorkbook = new ExcelJS.Workbook();
  combinedWorkbook.creator = "CareerGUIDE";
  combinedWorkbook.created = new Date();

  const cMeta = combinedWorkbook.addWorksheet("Metadata");
  applySheetFormatting(cMeta, [
    ["Field", "Value"],
    ["Export Timestamp", meta.export_timestamp],
    ["O*NET Release Version", meta.release_version],
    ["Total Occupations", meta.total_occupations_exported],
    ["Sheet Guide", "Combined_Master = 1 row per occupation | Combined_All_Ratings = all domains | Combined_Supporting = titles, tech, related"]
  ]);

  addDataSheet(combinedWorkbook, "Combined_Master", combined.masterCombined, MASTER_COMBINED_COLUMNS);
  addDataSheet(combinedWorkbook, "Combined_All_Ratings", combined.ratingsCombined, RATINGS_COMBINED_COLUMNS);
  addDataSheet(
    combinedWorkbook,
    "Combined_Supporting",
    combined.supportingCombined,
    SUPPORTING_COMBINED_COLUMNS
  );
  addDataSheet(combinedWorkbook, "Summary_Statistics", flattenSummary(summary), ["metric", "value"]);

  await combinedWorkbook.xlsx.writeFile(combinedOnlyPath);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "CareerGUIDE";
  workbook.created = new Date();

  const metaSheet = workbook.addWorksheet("Metadata");
  const metaRows = [
    ["Field", "Value"],
    ["Export Timestamp", meta.export_timestamp],
    ["O*NET Release Version", meta.release_version],
    ["Release ID", meta.release_id],
    ["Total Occupations Exported", meta.total_occupations_exported],
    ["Discarded Rows Removed", meta.discarded_rows_removed],
    ["Database Source", meta.database_source],
    ["Generation Environment", meta.generation_environment],
    ["Excel Enrichment", meta.excel_enrichment ? "yes" : "no"],
    ["Combined Workbook", combinedOnlyPath]
  ];
  applySheetFormatting(metaSheet, metaRows);

  addCombinedSheets(workbook, combined);

  addDataSheet(workbook, "Occupations", flattenOccupations(datasets.occupationRows), [
    "soc_code",
    "title",
    "description",
    "job_zone",
    "bright_outlook",
    "green_occupation",
    "median_salary",
    "classification_status",
    "holland_codes"
  ]);

  addDataSheet(workbook, "Alternate_Titles", datasets.alternateTitleRows, [
    "soc_code",
    "occupation_title",
    "alternate_title",
    "short_title",
    "source_type",
    "synonym"
  ]);

  addDataSheet(workbook, "Abilities", datasets.abilitiesRows, [
    "soc_code",
    "occupation_title",
    "element_id",
    "element_name",
    "category",
    "scale_id",
    "importance",
    "level"
  ]);

  addDataSheet(workbook, "Interests", datasets.interestsRows, [
    "soc_code",
    "occupation_title",
    "element_name",
    "holland_code",
    "riasec_name",
    "scale_id",
    "data_value"
  ]);

  addDataSheet(workbook, "Knowledge", datasets.knowledgeRows, [
    "soc_code",
    "occupation_title",
    "element_id",
    "element_name",
    "scale_id",
    "importance",
    "level"
  ]);

  addDataSheet(workbook, "Skills", datasets.skillsRows, [
    "soc_code",
    "occupation_title",
    "element_id",
    "element_name",
    "skill_category",
    "scale_id",
    "importance",
    "level"
  ]);

  addDataSheet(workbook, "Education_Training_Experience", datasets.educationRows, [
    "soc_code",
    "element_id",
    "element_name",
    "scale_id",
    "category",
    "data_value",
    "required_education",
    "experience_level",
    "training_requirement"
  ]);

  addDataSheet(workbook, "Task_Statements", datasets.taskStatements, [
    "soc_code",
    "task_id",
    "task_statement",
    "task_type",
    "is_emerging"
  ]);

  addDataSheet(workbook, "Emerging_Tasks", datasets.emergingTasks, [
    "soc_code",
    "task_id",
    "task_statement",
    "task_type",
    "is_emerging"
  ]);

  addDataSheet(workbook, "Task_Ratings", datasets.taskRatings, [
    "soc_code",
    "task_id",
    "scale_id",
    "scale_name",
    "data_value",
    "importance",
    "frequency",
    "criticality"
  ]);

  addDataSheet(workbook, "Technology_Skills", datasets.technologyRows, [
    "soc_code",
    "occupation_title",
    "example",
    "commodity_title",
    "category",
    "hot_technology",
    "in_demand"
  ]);

  addDataSheet(workbook, "Tools_Used", datasets.toolsRows, [
    "soc_code",
    "tool_name",
    "commodity_code",
    "commodity_title",
    "category"
  ]);

  addDataSheet(workbook, "Work_Activities", datasets.workActivitiesRows, [
    "soc_code",
    "occupation_title",
    "element_id",
    "element_name",
    "scale_id",
    "importance",
    "level"
  ]);

  addDataSheet(workbook, "Work_Context", datasets.workContextRows, [
    "soc_code",
    "occupation_title",
    "element_id",
    "element_name",
    "scale_id",
    "importance",
    "level"
  ]);

  addDataSheet(workbook, "Work_Styles", datasets.workStylesRows, [
    "soc_code",
    "occupation_title",
    "element_id",
    "element_name",
    "scale_id",
    "importance",
    "level"
  ]);

  addDataSheet(workbook, "Work_Values", datasets.workValuesRows, [
    "soc_code",
    "occupation_title",
    "element_id",
    "element_name",
    "scale_id",
    "importance",
    "level"
  ]);

  addDataSheet(workbook, "Competencies", datasets.competenciesRows, [
    "soc_code",
    "occupation_title",
    "work_activity_id",
    "work_activity_name",
    "competency_score",
    "scale_id"
  ]);

  addDataSheet(workbook, "Related_Occupations", datasets.relatedRows, [
    "soc_code",
    "occupation_title",
    "related_soc_code",
    "related_title",
    "relatedness_tier",
    "match_index"
  ]);

  addDataSheet(workbook, "Validation_Report", flattenValidation(validation), ["metric", "value"]);
  addDataSheet(workbook, "Summary_Statistics", flattenSummary(summary), ["metric", "value"]);

  await workbook.xlsx.writeFile(outputPath);

  return {
    path: outputPath,
    combinedPath: combinedOnlyPath,
    worksheetCount: workbook.worksheets.length,
    combinedWorksheetCount: combinedWorkbook.worksheets.length,
    combinedMasterRows: combined.masterCombined.length,
    combinedRatingsRows: combined.ratingsCombined.length,
    combinedSupportingRows: combined.supportingCombined.length
  };
};
