import { sql } from "drizzle-orm";

import type { Insert, MySQLAdapter } from "./types.js";

export const insert: Insert = async function (
  // Here 'this' is not a parameter. See:
  // https://www.typescriptlang.org/docs/handbook/2/classes.html#this-parameters
  this: MySQLAdapter,
  { db, onConflictDoUpdate, tableName, values },
): Promise<Record<string, unknown>[]> {
  const table = this.tables[tableName];

  if (onConflictDoUpdate) {
    await db
      .insert(table)
      .values(values)
      .onDuplicateKeyUpdate(onConflictDoUpdate);
  } else {
    await db.insert(table).values(values);
  }

  // Since MySQL doesn't support RETURNING clause like PostgreSQL,
  // we need to get the inserted IDs and fetch the records manually
  const insertedIds = Array.isArray(values)
    ? values.map((v) => v.id).filter(Boolean)
    : values.id
      ? [values.id]
      : [];

  if (insertedIds.length) {
    return await db
      .select()
      .from(table)
      .where(sql`id IN (${insertedIds.join(",")})`);
  }

  // If we can't get IDs, return empty array or original values as fallback
  return Array.isArray(values) ? values : [values];
};
