import { sql } from "drizzle-orm";

import type { MySQLAdapter } from "./types.js";

export async function insert(
  this: MySQLAdapter,
  tableName: string,
  data: Record<string, any>,
): Promise<{ id: string | number }> {
  try {
    const columns = Object.keys(data);
    const placeholders = columns.map(() => "?").join(", ");
    const values = Object.values(data);

    // Handle empty insert
    if (columns.length === 0) {
      const [result] = await this.client.query(
        `INSERT INTO ${tableName} () VALUES ()`,
      );
      const resultHeader = result as any;
      return { id: resultHeader.insertId };
    }

    // Standard insert
    const [result] = await this.client.query(
      `INSERT INTO ${tableName} (${columns.join(", ")}) VALUES (${placeholders})`,
      values,
    );

    const resultHeader = result as any;
    return { id: resultHeader.insertId };
  } catch (error) {
    this.payload.logger.error(`Error in insert: ${error.message}`);
    throw error;
  }
}
