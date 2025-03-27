import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  datetime,
  json as drizzleJson,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  varchar,
} from "drizzle-orm/mysql-core";

import type {
  BuildDrizzleTableArgs,
  RawColumn,
  RawTable,
  SQLAdapter,
} from "../types";

/**
 * Builds a MySQL table using Drizzle ORM
 *
 * @param options Object containing table configuration
 * @returns The created table
 */
export const buildDrizzleTable = ({
  adapter,
  tableName,
  tableConfig,
}: BuildDrizzleTableArgs) => {
  const columns: Record<string, any> = {};

  // Process each column definition
  for (const [key, columnDef] of Object.entries<RawColumn>(
    tableConfig.columns,
  )) {
    // Skip columns that don't have a name
    if (!columnDef.name) continue;

    let column;

    // Create the column based on its type
    switch (columnDef.type) {
      case "boolean":
        column = boolean(columnDef.name);
        break;
      case "enum":
        if (columnDef.options && columnDef.options.length > 0) {
          // Convert string[] to tuple with at least one element
          const enumOptions =
            columnDef.options.length > 0
              ? ([columnDef.options[0], ...columnDef.options.slice(1)] as [
                  string,
                  ...string[],
                ])
              : (["default_value"] as [string]);
          column = mysqlEnum(columnDef.name, enumOptions);
        } else {
          column = varchar(columnDef.name, { length: 255 });
        }
        break;
      case "json":
        column = drizzleJson(columnDef.name);
        break;
      case "number":
        if (columnDef.autoIncrement) {
          // Use bigint with appropriate config
          column = bigint(columnDef.name, { mode: "number" }).autoincrement();
        } else {
          column = int(columnDef.name);
        }
        break;
      case "timestamp":
        column = datetime(columnDef.name, { mode: "string" });
        break;
      case "uuid":
        column = varchar(columnDef.name, { length: 36 });
        break;
      case "varchar":
        column = varchar(columnDef.name, { length: columnDef.length || 255 });
        break;
      case "text":
      default:
        column = text(columnDef.name);
        break;
    }

    // Add constraints
    if (columnDef.primaryKey) {
      column = column.primaryKey();
    }

    if (columnDef.notNull) {
      column = column.notNull();
    }

    // Add default values
    if (columnDef.defaultNow) {
      column = column.default(sql`CURRENT_TIMESTAMP`);
    } else if (columnDef.default !== undefined && columnDef.default !== null) {
      column = column.default(columnDef.default);
    }

    // Store the column
    columns[key] = column;
  }

  // Create the table
  const table = mysqlTable(tableName, columns);

  // Store the table in the adapter's table registry
  if (adapter && adapter.tables) {
    adapter.tables[tableName] = table;
  }

  return table;
};
