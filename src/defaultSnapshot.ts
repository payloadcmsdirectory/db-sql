import type { ExtractTablesWithRelations } from "drizzle-orm";
import { mysqlTable, varchar } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";

/**
 * Default snapshot schema for MySQL
 * This is used when no schema is provided
 */
export const defaultDrizzleSnapshot = {
  defaultData: {
    mysqlTables: [
      {
        name: "schema_migrations",
        columns: {
          version: varchar("version", { length: 255 }).primaryKey().notNull(),
          dirty: varchar("dirty", { length: 1 }).notNull(),
        },
        indexes: [],
      },
    ],
    tables: () => ({
      schema_migrations: mysqlTable("schema_migrations", {
        version: varchar("version", { length: 255 }).primaryKey().notNull(),
        dirty: varchar("dirty", { length: 1 }).notNull(),
      }),
    }),
  },
  schema: {},
};
