import { MySQLAdapter } from "./types";
import { sql } from "./drizzle-proxy";

/**
 * Drop all tables in the database
 *
 * @param this MySQLAdapter instance
 * @returns Promise resolving when all tables are dropped
 */
export async function dropDatabase(this: MySQLAdapter): Promise<void> {
  // Get list of all tables
  let tableNames: string[] = [];

  try {
    // Disable foreign key checks to prevent constraint errors
    await this.db.execute(sql`SET FOREIGN_KEY_CHECKS = 0;`);

    // Get all tables
    const result = await this.db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE()
    `);

    if (Array.isArray(result) && result.length > 0) {
      // @ts-ignore - Result structure is an array of objects with table_name
      tableNames = result.map((row) => row.table_name);
    }

    // Drop each table
    for (const tableName of tableNames) {
      await this.db.execute(
        sql`DROP TABLE IF EXISTS ${sql.identifier(tableName)}`,
      );
    }

    // Re-enable foreign key checks
    await this.db.execute(sql`SET FOREIGN_KEY_CHECKS = 1;`);

    if (this.payload?.logger) {
      this.payload.logger.info("Database tables dropped successfully");
    }
  } catch (error) {
    if (this.payload?.logger) {
      this.payload.logger.error(
        `Error dropping database: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    // Re-enable foreign key checks even if there was an error
    try {
      await this.db.execute(sql`SET FOREIGN_KEY_CHECKS = 1;`);
    } catch (e) {
      // Ignore error when re-enabling foreign key checks
    }

    throw error;
  }
}
