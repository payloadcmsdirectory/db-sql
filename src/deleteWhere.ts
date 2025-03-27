import { sql } from "drizzle-orm";

import type { MySQLAdapter } from "./types.js";

export async function deleteWhere(
  this: MySQLAdapter,
  tableName: string,
  whereStatement: string,
  values: any[] = [],
): Promise<number> {
  try {
    const result = await this.drizzle.execute(
      sql`DELETE FROM ${sql.raw(tableName)} WHERE ${sql.raw(whereStatement)}`,
      values,
    );

    // Return number of affected rows
    return result.rowsAffected;
  } catch (error) {
    this.payload.logger.error(`Error in deleteWhere: ${error.message}`);
    throw error;
  }
}
