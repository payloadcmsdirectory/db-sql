import { bigint, varchar } from "drizzle-orm/mysql-core";
import { v4 as uuidv4 } from "uuid";

import type { SetColumnIDArgs } from "../types";

/**
 * Creates an ID column for a database table
 */
export const setColumnID = ({
  idType = "number",
  autoIncrement = true,
}: SetColumnIDArgs) => {
  if (idType === "uuid") {
    // UUID type ID
    return varchar("id", { length: 36 }).notNull().primaryKey();
  }

  // Default numeric ID, auto-incremented
  return bigint("id", { mode: "number" })
    .notNull()
    .primaryKey()
    .autoincrement();
};
