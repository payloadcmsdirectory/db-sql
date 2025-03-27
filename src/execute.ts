import { MySQLAdapter } from "./types";

/**
 * Execute a raw SQL query
 *
 * @param this MySQLAdapter instance
 * @param query SQL query to execute
 * @param values Query parameters
 * @returns Query result
 */
export async function execute(
  this: MySQLAdapter,
  query: string,
  values: any[] = [],
): Promise<any> {
  try {
    if (!this.client) {
      throw new Error("Database client not initialized");
    }

    // Use the client's query method directly for raw SQL
    const result = await this.client.query(query, values);
    return result;
  } catch (error) {
    if (this.payload?.logger) {
      this.payload.logger.error(
        `Error executing SQL: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    throw error;
  }
}
