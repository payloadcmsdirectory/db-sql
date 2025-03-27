import {
  index,
  mysqlTable,
  primaryKey,
  uniqueIndex,
} from "drizzle-orm/mysql-core";

import type { BuildDrizzleTableArgs } from "../types";
import { sql } from "../drizzle-proxy";

/**
 * Builds a Drizzle table schema from a raw table configuration
 */
export function buildDrizzleTable({
  adapter,
  tableName,
  tableConfig,
}: BuildDrizzleTableArgs) {
  const { columns, indexes = [] } = tableConfig;
  const drizzleColumns = {};

  // Process columns
  for (const column of columns) {
    const {
      name,
      type,
      required = false,
      primary = false,
      defaultValue,
      unique = false,
    } = column;

    // Skip if column name is empty
    if (!name) continue;

    // Define column using the adapter's columnToCodeConverter
    let drizzleColumn = adapter.generateSchema.columnToCodeConverter(
      name,
      type,
      {
        primaryKey: primary,
        notNull: required,
        unique,
        default: defaultValue !== undefined ? defaultValue : undefined,
        length: column.length,
        options: column.options,
      },
    );

    // Add the column to the columns object
    drizzleColumns[name] = drizzleColumn;
  }

  // Create the table
  const table = mysqlTable(tableName, drizzleColumns);

  // Register indexes if any
  if (indexes && indexes.length) {
    for (const idx of indexes) {
      const { fields, unique = false, name } = idx;

      if (!fields || !fields.length) continue;

      if (fields.length === 1) {
        // Single column index
        if (unique) {
          uniqueIndex(
            name || `idx_${tableName}_${fields[0]}`,
            table[fields[0]],
          );
        } else {
          index(name || `idx_${tableName}_${fields[0]}`, table[fields[0]]);
        }
      } else {
        // Multi-column index
        if (unique) {
          uniqueIndex(
            name || `idx_${tableName}_${fields.join("_")}`,
            fields.map((field) => table[field]),
          );
        } else {
          index(
            name || `idx_${tableName}_${fields.join("_")}`,
            fields.map((field) => table[field]),
          );
        }
      }
    }
  }

  // Register the table in the adapter
  adapter.tables[tableName] = table;

  return table;
}
