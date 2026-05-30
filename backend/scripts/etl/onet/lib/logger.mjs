const levels = { debug: 0, info: 1, warn: 2, error: 3 };

const current =
  levels[process.env.ETL_LOG_LEVEL?.toLowerCase()] ?? levels.info;

export const log = (level, message, meta) => {
  if (levels[level] < current) return;
  const prefix = `[etl][${level}]`;
  if (meta !== undefined) {
    console[level === "error" ? "error" : "log"](prefix, message, meta);
  } else {
    console[level === "error" ? "error" : "log"](prefix, message);
  }
};

export const logInfo = (msg, meta) => log("info", msg, meta);
export const logWarn = (msg, meta) => log("warn", msg, meta);
export const logError = (msg, meta) => log("error", msg, meta);
