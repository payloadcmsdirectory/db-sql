import { MySQLAdapter } from "./types";
import { sql } from "./drizzle-proxy";

/**
 * Delete records from a collection based on a where condition.
 *
 * @param this MySQLAdapter instance
 * @param collection Collection name
 * @param whereSQL SQL where clause
 * @returns Number of deleted records
 */
export async function deleteWhere(
  this: MySQLAdapter,
  collection: string,
  whereSQL: string,
): Promise<number> {
  try {
    const table = this.tables[collection];
    if (!table) return 0;

    const result = await this.db.delete(table).where(sql.raw(whereSQL));

    return Number(result.rowsAffected) || 0;
  } catch (error) {
    if (this.payload?.logger) {
      this.payload.logger.error(
        `Error in deleteWhere: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    throw error;
  }
}
