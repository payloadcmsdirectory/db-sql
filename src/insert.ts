import { MySQLAdapter } from "./types";

/**
 * Insert a record into a collection
 *
 * @param this MySQLAdapter instance
 * @param collection Collection name
 * @param data Data to insert
 * @returns Inserted record with ID
 */
export async function insert(
  this: MySQLAdapter,
  collection: string,
  data: Record<string, any>,
): Promise<Record<string, any>> {
  try {
    // Get the table for this collection
    const table = this.tables[collection];
    if (!table) {
      throw new Error(`Table not found for collection: ${collection}`);
    }

    // Prepare data for insertion - remove any fields that don't exist in the table
    const insertData: Record<string, any> = {};

    // Filter data to match table columns
    Object.keys(data).forEach((key) => {
      if (key in table) {
        insertData[key] = data[key];
      }
    });

    // Insert the data and get the ID
    const result = await this.db
      .insert(table)
      .values(insertData)
      .$returningId();

    // Return the record with ID
    return {
      ...insertData,
      id: result,
    };
  } catch (error) {
    if (this.payload?.logger) {
      this.payload.logger.error(
        `Error in insert: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    throw error;
  }
}
