import { serial, varchar } from "drizzle-orm/mysql-core";

import type { SetColumnIDArgs } from "../types";

/**
 * Sets up the ID column for a table based on configuration
 */
export function setColumnID({
  idType = "number",
  autoIncrement = true,
}: SetColumnIDArgs = {}) {
  if (idType === "uuid") {
    // For UUID, we use varchar
    return varchar("id", { length: 36 });
  }

  // For numeric IDs, we use serial if auto-increment is enabled
  if (autoIncrement) {
    return serial("id").primaryKey();
  }

  // Otherwise, use varchar
  return varchar("id", { length: 255 });
}
