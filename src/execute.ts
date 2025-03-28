import { sql } from "drizzle-orm";

import type { Execute } from "./types.js";

export const execute: Execute<any> = function execute({
  db,
  drizzle,
  raw,
  sql: statement,
}) {
  const executeFrom = (db ?? drizzle)!;

  if (raw) {
    return sql`${executeFrom.execute(sql.raw(raw))}`;
  } else {
    return sql`${executeFrom.execute(statement!)}`;
  }
};
