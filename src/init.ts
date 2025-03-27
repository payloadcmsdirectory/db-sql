import type { MySQLAdapter } from "./types.js";

export async function init(this: MySQLAdapter): Promise<void> {
  try {
    // Run beforeSchemaInit hooks
    if (this.beforeSchemaInit && this.beforeSchemaInit.length > 0) {
      for (const hook of this.beforeSchemaInit) {
        await hook({ adapter: this });
      }
    }

    // Initialize schema and tables from collections
    // This is handled by the drizzle-orm adapter at a higher level

    // Run afterSchemaInit hooks
    if (this.afterSchemaInit && this.afterSchemaInit.length > 0) {
      for (const hook of this.afterSchemaInit) {
        await hook({ adapter: this });
      }
    }

    this.payload.logger.info("MySQL adapter initialized successfully");
  } catch (error) {
    this.payload.logger.error(
      `Error initializing MySQL adapter: ${error.message}`,
    );
    throw error;
  }
}
