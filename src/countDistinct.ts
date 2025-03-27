import { MySQLAdapter } from "./types";
import { sql } from "./drizzle-proxy";

/**
 * Count the number of distinct values for a specific field in a collection.
 *
 * @param this MySQLAdapter instance
 * @param collection Collection name
 * @param field Field to count
 * @returns Count of distinct values
 */
export async function countDistinct(
  this: MySQLAdapter,
  collection: string,
  field: string,
): Promise<number> {
  try {
    const table = this.tables[collection];
    if (!table) return 0;

    const result = await this.db
      .select({
        count: sql<number>`COUNT(DISTINCT ${sql.identifier(field)})`,
      })
      .from(table);

    return Number(result[0]?.count) || 0;
  } catch (error) {
    if (this.payload?.logger) {
      this.payload.logger.error(
        `Error in countDistinct: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    throw error;
  }
}
