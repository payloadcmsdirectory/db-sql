import type { Config } from "payload";

import type { SQLAdapterOptions } from "./types";
import { sqlAdapter } from "./adapter";

export * from "./types";
export { sqlAdapter };

/**
 * SQL Database Adapter for PayloadCMS
 *
 * Usage:
 * ```typescript
 * import { sqlAdapter } from '@launchthat.apps/payload-sql';
 *
 * export default buildConfig({
 *   db: sqlAdapter({
 *     host: 'localhost',
 *     user: 'root',
 *     password: 'password',
 *     database: 'payload',
 *     tablePrefix: 'pl_',
 *   }),
 * });
 * ```
 */
export const pluginSQLDatabase =
  (options: SQLAdapterOptions) =>
  (incomingConfig: Config): Config => {
    return {
      ...incomingConfig,
      db: sqlAdapter(options),
    };
  };

export default pluginSQLDatabase;
