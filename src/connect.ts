import type { DrizzleAdapter } from "@payloadcms/drizzle/types";
import type { Connect, Migration } from "payload";
import { pushDevSchema } from "@payloadcms/drizzle";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

import type { MySQLAdapter } from "./types.js";

export const connect: Connect = async function connect(
  this: MySQLAdapter,
  options = {
    hotReload: false,
  },
) {
  const { hotReload } = options;

  this.schema = {
    ...this.tables,
    ...this.relations,
  };

  try {
    if (!this.client) {
      this.client = await mysql.createPool(this.clientConfig.pool);
    }

    const logger = this.logger || false;
    this.drizzle = drizzle(this.client, {
      logger,
      schema: this.schema,
      mode: "default",
    });

    if (!hotReload) {
      if (process.env.PAYLOAD_DROP_DATABASE === "true") {
        this.payload.logger.info(`---- DROPPING TABLES ----`);
        await this.dropDatabase({ adapter: this });
        this.payload.logger.info("---- DROPPED TABLES ----");
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    this.payload.logger.error({
      err,
      msg: `Error: cannot connect to MySQL: ${message}`,
    });
    if (typeof this.rejectInitializing === "function") {
      this.rejectInitializing();
    }
    process.exit(1);
  }

  // Only push schema if not in production
  if (
    process.env.NODE_ENV !== "production" &&
    process.env.PAYLOAD_MIGRATING !== "true" &&
    this.push !== false
  ) {
    await pushDevSchema(this as unknown as DrizzleAdapter);
  }

  if (typeof this.resolveInitializing === "function") {
    this.resolveInitializing();
  }

  if (process.env.NODE_ENV === "production" && this.prodMigrations) {
    await this.migrate({ migrations: this.prodMigrations as Migration[] });
  }
};
