/**
 * Minimal structured logging (replace with pino/winston in production if needed).
 * @param {"info"|"warn"|"error"} level
 * @param {string} msg
 * @param {Record<string, unknown>} [meta]
 */
export function log(level, msg, meta) {
  const line = meta && Object.keys(meta).length ? `${msg} ${JSON.stringify(meta)}` : msg;
  if (level === "error") {
    // eslint-disable-next-line no-console
    console.error(`[career-guide-api] ${line}`);
  } else if (level === "warn") {
    // eslint-disable-next-line no-console
    console.warn(`[career-guide-api] ${line}`);
  } else {
    // eslint-disable-next-line no-console
    console.log(`[career-guide-api] ${line}`);
  }
}
