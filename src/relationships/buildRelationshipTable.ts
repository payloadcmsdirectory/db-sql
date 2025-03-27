import type { MySqlTable } from "drizzle-orm/mysql-core";
import { bigint, int, mysqlTable } from "drizzle-orm/mysql-core";

import type { MySQLAdapter } from "../types";

/**
 * Arguments for building a relationship table
 */
export interface BuildRelationshipTableArgs {
  adapter: MySQLAdapter;
  fromCollection: string;
  toCollection: string;
  relationField: string;
}

/**
 * Builds a relationship table for a many-to-many relationship
 */
export function buildRelationshipTable({
  adapter,
  fromCollection,
  toCollection,
  relationField,
}: BuildRelationshipTableArgs): MySqlTable {
  // Generate a table name for the relationship
  const relationshipsSuffix = "_rels";
  const tableName = `${adapter.tablePrefix}${fromCollection}_${toCollection}${relationshipsSuffix}`;

  // Check if the table already exists in the adapter
  if (
    adapter.tables[`${fromCollection}_${toCollection}${relationshipsSuffix}`]
  ) {
    return adapter.tables[
      `${fromCollection}_${toCollection}${relationshipsSuffix}`
    ];
  }

  // Create the relationship table
  const table = mysqlTable(`${tableName}`, {
    id: bigint("id", { mode: "number" }).primaryKey().autoincrement(),
    order: int("order").notNull().default(0),
    parentId: bigint("parentId", { mode: "number" }).notNull(),
    childId: bigint("childId", { mode: "number" }).notNull(),
  });

  // Register the table in the adapter
  adapter.tables[`${fromCollection}_${toCollection}${relationshipsSuffix}`] =
    table;

  return table;
}

/**
 * Create relationship entries in the relationship table
 */
export async function createRelationshipDrizzleTable({
  adapter,
  fromCollection,
  fromId,
  toCollection,
  relationField,
  value,
}: {
  adapter: MySQLAdapter;
  fromCollection: string;
  fromId: string | number;
  toCollection: string;
  relationField: string;
  value: string | number | Array<string | number>;
}): Promise<void> {
  // Get relationship table name
  const relationshipsSuffix = "_rels";
  const tableName = `${adapter.tablePrefix}${fromCollection}_${toCollection}${relationshipsSuffix}`;

  // Convert single values to array
  const valueArray = Array.isArray(value) ? value : [value];

  // Skip if empty
  if (valueArray.length === 0) return;

  // Insert relationships with order
  const placeholders = valueArray.map(() => "(?, ?, ?)").join(", ");
  const values = valueArray.flatMap((childId, index) => [
    fromId,
    childId,
    index,
  ]);

  await adapter.client.query(
    `INSERT INTO ${tableName} (parentId, childId, \`order\`) VALUES ${placeholders}`,
    values,
  );
}
