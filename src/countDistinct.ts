import { sql } from "drizzle-orm";

import type { MySQLAdapter } from "./types.js";

export async function countDistinct(
  this: MySQLAdapter,
  tableName: string,
  columnName: string,
): Promise<number> {
  try {
    const result = await this.drizzle.execute(
      sql`SELECT COUNT(DISTINCT ${sql.raw(columnName)}) as count FROM ${sql.raw(tableName)}`,
    );

    if (Array.isArray(result) && result.length > 0) {
      return Number(result[0].count);
    }

    return 0;
  } catch (error) {
    this.payload.logger.error(`Error in countDistinct: ${error.message}`);
    return 0;
  }
}
