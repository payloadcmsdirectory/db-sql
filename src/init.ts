import { MySQLAdapter } from "./types";

/**
 * Initialize the MySQL adapter
 *
 * @param this MySQLAdapter instance
 * @returns Promise that resolves when initialization is complete
 */
export async function init(this: MySQLAdapter): Promise<void> {
  try {
    // Run before schema init hooks
    if (this.beforeSchemaInit && this.beforeSchemaInit.length > 0) {
      for (const hook of this.beforeSchemaInit) {
        await hook({ adapter: this });
      }
    }

    // Initialize schema (implementation specific to the adapter)
    // TODO: Add schema initialization logic here

    // Run after schema init hooks
    if (this.afterSchemaInit && this.afterSchemaInit.length > 0) {
      for (const hook of this.afterSchemaInit) {
        await hook({ adapter: this });
      }
    }

    if (this.payload?.logger) {
      this.payload.logger.info("MySQL adapter initialized successfully");
    }
  } catch (error) {
    if (this.payload?.logger) {
      this.payload.logger.error(
        `Error initializing MySQL adapter: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    // Reject the initialization promise if it exists
    if (this.rejectInitializing) {
      this.rejectInitializing(
        error instanceof Error ? error : new Error(String(error)),
      );
    }

    throw error;
  }
}
