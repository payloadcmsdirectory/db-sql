import type { BuildDrizzleTableArgs, MySQLAdapter } from "../types";
import {
  index,
  mysqlTable,
  primaryKey,
  uniqueIndex,
} from "drizzle-orm/mysql-core";

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
  const drizzleColumns: Record<string, any> = {};

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
    let drizzleColumn = (
      adapter as MySQLAdapter
    ).generateSchema?.columnToCodeConverter(name, type, {
      primaryKey: primary,
      notNull: required,
      unique,
      default: defaultValue !== undefined ? defaultValue : undefined,
      length: column.length,
      options: column.options,
    });

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
          uniqueIndex(name || `idx_${tableName}_${fields[0]}`).on(
            table[fields[0]],
          );
        } else {
          index(name || `idx_${tableName}_${fields[0]}`).on(table[fields[0]]);
        }
      } else {
        // Multi-column index
        const indexColumns = fields.map((field) => table[field]);

        if (unique) {
          // Use first column and additional columns if available
          if (indexColumns.length >= 2) {
            uniqueIndex(name || `idx_${tableName}_${fields.join("_")}`).on(
              indexColumns[0],
              indexColumns[1],
              ...indexColumns.slice(2),
            );
          } else if (indexColumns.length === 1) {
            uniqueIndex(name || `idx_${tableName}_${fields.join("_")}`).on(
              indexColumns[0],
            );
          }
        } else {
          // Use first column and additional columns if available
          if (indexColumns.length >= 2) {
            index(name || `idx_${tableName}_${fields.join("_")}`).on(
              indexColumns[0],
              indexColumns[1],
              ...indexColumns.slice(2),
            );
          } else if (indexColumns.length === 1) {
            index(name || `idx_${tableName}_${fields.join("_")}`).on(
              indexColumns[0],
            );
          }
        }
      }
    }
  }

  // Register the table in the adapter
  (adapter as MySQLAdapter).tables[tableName] = table;

  return table;
}
