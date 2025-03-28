import type { DrizzleAdapter } from "@payloadcms/drizzle/types";
import type { Init } from "payload";
import {
  buildDrizzleRelations,
  buildRawSchema,
  executeSchemaHooks,
} from "@payloadcms/drizzle";

import type { MySQLAdapter } from "./types";
import { buildDrizzleTable } from "./schema/buildDrizzleTable";
import { setColumnID } from "./schema/setColumnID";

/**
 * Initialize the database tables
 */
export const init: Init = async function init(this: MySQLAdapter) {
  let locales: string[] | undefined;

  this.rawRelations = {};
  this.rawTables = {};

  if (this.payload.config.localization) {
    locales = this.payload.config.localization.locales.map(({ code }) => code);
  }

  const adapter = this as unknown as DrizzleAdapter;

  buildRawSchema({
    adapter,
    setColumnID,
  });

  await executeSchemaHooks({ type: "beforeSchemaInit", adapter: this });

  for (const tableName in this.rawTables) {
    buildDrizzleTable({
      adapter,
      locales: locales || ["en"],
      rawTable: this.rawTables[tableName]!,
    });
  }

  buildDrizzleRelations({
    adapter,
  });

  await executeSchemaHooks({ type: "afterSchemaInit", adapter: this });

  this.payload.logger.info("MySQL adapter initialized successfully");
};
