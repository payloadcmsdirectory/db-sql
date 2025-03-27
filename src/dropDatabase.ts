import { sql } from "drizzle-orm";

import type { MySQLAdapter } from "./types.js";

export async function dropDatabase(this: MySQLAdapter): Promise<void> {
  try {
    // Get all tables in the database except system tables
    const tablesResult = await this.client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE()
      AND table_type = 'BASE TABLE'
    `);

    if (!Array.isArray(tablesResult) || tablesResult.length < 1) {
      return;
    }

    const tables = tablesResult[0] as Array<{ table_name: string }>;

    if (tables.length === 0) {
      return;
    }

    // Disable foreign key checks to allow dropping tables with dependencies
    await this.client.query("SET FOREIGN_KEY_CHECKS = 0");

    // Drop each table
    for (const table of tables) {
      const tableName = table.table_name;
      await this.drizzle.execute(
        sql`DROP TABLE IF EXISTS ${sql.raw(tableName)}`,
      );
    }

    // Re-enable foreign key checks
    await this.client.query("SET FOREIGN_KEY_CHECKS = 1");

    this.payload.logger.info("Database tables dropped successfully");
  } catch (error) {
    this.payload.logger.error(`Error dropping database: ${error.message}`);
    throw error;
  }
}
