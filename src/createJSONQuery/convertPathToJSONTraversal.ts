import type { MySQLAdapter } from "../types.js";

export function convertPathToJSONTraversal(
  this: MySQLAdapter,
  path: string[],
  columnName: string = "data",
): string {
  // For MySQL, we use JSON_EXTRACT for path-based queries
  const jsonPath = `$${path.map((segment) => `.${segment}`).join("")}`;
  return `JSON_EXTRACT(${columnName}, '${jsonPath}')`;
}
