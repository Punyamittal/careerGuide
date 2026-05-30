import { existsSync } from "fs";
import { readExcelSheet, col, soc } from "../excel.mjs";
import { logInfo } from "../logger.mjs";

/**
 * Optional enrichment from raw O*NET Excel when source path is available.
 * @param {string | null} dir
 */
export const loadExcelExtras = (dir) => {
  const empty = {
    occupations: new Map(),
    taskStatements: [],
    emergingTasks: [],
    taskRatings: [],
    education: [],
    toolsUsed: []
  };

  if (!dir || !existsSync(dir)) {
    return { extras: empty, loaded: false };
  }

  const occupations = new Map();
  const occRows = readExcelSheet(dir, "Occupation Data.xlsx");
  if (occRows) {
    for (const row of occRows) {
      const code = soc(row);
      if (!code) continue;
      occupations.set(code, {
        bright_outlook:
          parseBool(col(row, "Bright Outlook", "Bright Outlook Occupation")) ??
          parseBool(col(row, "Bright Outlook Category")),
        green_occupation: parseBool(col(row, "Green Occupation", "Green")),
        median_salary: numOrNull(col(row, "Median Annual Wage", "Median Wage"))
      });
    }
    logInfo(`Excel extras: occupation metadata ${occupations.size}`);
  }

  empty.taskStatements.push(...parseTasks(dir, "Task Statements.xlsx", false));
  empty.emergingTasks.push(...parseTasks(dir, "Emerging Tasks.xlsx", true));
  empty.taskRatings.push(...parseTaskRatings(dir));
  empty.education.push(...parseEducation(dir));
  empty.toolsUsed.push(...parseTools(dir));

  return { extras: { ...empty, occupations }, loaded: true };
};

const parseBool = (v) => {
  if (v === null || v === undefined || v === "") return null;
  const s = String(v).toLowerCase();
  if (["y", "yes", "true", "1"].includes(s)) return true;
  if (["n", "no", "false", "0"].includes(s)) return false;
  return Boolean(v);
};

const numOrNull = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const parseTasks = (dir, file, emerging) => {
  const rows = readExcelSheet(dir, file);
  if (!rows) return [];
  const out = [];
  for (const row of rows) {
    const soc_code = soc(row);
    const task = col(row, "Task", "Task Statement");
    if (!soc_code || !task) continue;
    out.push({
      soc_code,
      task_id: col(row, "Task ID", "Incumbent Task Number"),
      task_statement: String(task).trim(),
      task_type: col(row, "Task Type"),
      is_emerging: emerging
    });
  }
  logInfo(`parsed ${file}: ${out.length}`);
  return out;
};

const parseTaskRatings = (dir) => {
  const rows = readExcelSheet(dir, "Task Ratings.xlsx");
  if (!rows) return [];
  const out = [];
  for (const row of rows) {
    const soc_code = soc(row);
    const taskId = col(row, "Task ID");
    if (!soc_code) continue;
    out.push({
      soc_code,
      task_id: taskId,
      scale_id: col(row, "Scale ID"),
      scale_name: col(row, "Scale Name"),
      data_value: numOrNull(col(row, "Data Value")),
      importance: col(row, "Scale ID") === "IM" ? numOrNull(col(row, "Data Value")) : null,
      frequency: col(row, "Scale ID") === "FT" ? numOrNull(col(row, "Data Value")) : null,
      criticality: col(row, "Scale Name")?.toString().toLowerCase().includes("critical")
        ? numOrNull(col(row, "Data Value"))
        : null
    });
  }
  logInfo(`parsed Task Ratings.xlsx: ${out.length}`);
  return out;
};

const parseEducation = (dir) => {
  const rows = readExcelSheet(dir, "Education, Training, and Experience.xlsx");
  if (!rows) return [];
  const out = [];
  for (const row of rows) {
    const soc_code = soc(row);
    if (!soc_code) continue;
    out.push({
      soc_code,
      element_id: col(row, "Element ID"),
      element_name: col(row, "Element Name"),
      scale_id: col(row, "Scale ID"),
      category: col(row, "Category"),
      data_value: numOrNull(col(row, "Data Value")),
      required_education: col(row, "Element Name")?.toString().includes("Education")
        ? col(row, "Category")
        : null,
      experience_level: col(row, "Element Name")?.toString().includes("Experience")
        ? col(row, "Category")
        : null,
      training_requirement: col(row, "Element Name")?.toString().includes("Training")
        ? col(row, "Category")
        : null
    });
  }
  logInfo(`parsed ETE.xlsx: ${out.length}`);
  return out;
};

const parseTools = (dir) => {
  const rows = readExcelSheet(dir, "Tools Used.xlsx");
  if (!rows) return [];
  const out = [];
  for (const row of rows) {
    const soc_code = soc(row);
    const tool = col(row, "Tools Used", "Example", "Commodity Title");
    if (!soc_code || !tool) continue;
    out.push({
      soc_code,
      tool_name: String(tool).trim(),
      commodity_code: col(row, "Commodity Code"),
      commodity_title: col(row, "Commodity Title"),
      category: col(row, "Commodity Title")
    });
  }
  logInfo(`parsed Tools Used.xlsx: ${out.length}`);
  return out;
};

export const extractSourcePathFromNotes = (notes) => {
  if (!notes) return null;
  const m = String(notes).match(/from\s+(.+)$/i);
  return m?.[1]?.trim() ?? null;
};
