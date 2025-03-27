import { sql } from "drizzle-orm";

import type { MySQLAdapter } from "./types.js";

export async function execute(
  this: MySQLAdapter,
  statement: string,
  values: any[] = [],
): Promise<any> {
  try {
    // Use the transaction client if available, otherwise use the regular client
    const client = this.transactionClient || this.client;

    if (!client) {
      throw new Error("No database client available");
    }

    const [result] = await client.query(statement, values);
    return result;
  } catch (error) {
    this.payload.logger.error(`Error executing SQL: ${error.message}`);
    throw error;
  }
}
