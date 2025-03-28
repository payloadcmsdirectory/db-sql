import { fileURLToPath } from "url";
import type { Operators } from "@payloadcms/drizzle";
import type { DatabaseAdapterObj, Payload } from "payload";
import {  } from 'payload/test';
import {
  beginTransaction,
  buildCreateMigration,
  commitTransaction,
  count,
  countGlobalVersions,
  countVersions,
  create,
  createGlobal,
  createGlobalVersion,
  createSchemaGenerator,
  createVersion,
  deleteMany,
  deleteOne,
  deleteVersions,
  destroy,
  find,
  findGlobal,
  findGlobalVersions,
  findMigrationDir,
  findOne,
  findVersions,
  migrate,
  migrateDown,
  migrateFresh,
  migrateRefresh,
  migrateReset,
  migrateStatus,
  operatorMap,
  queryDrafts,
  rollbackTransaction,
  updateGlobal,
  updateGlobalVersion,
  updateJobs,
  updateMany,
  updateOne,
  updateVersion,
} from "@payloadcms/drizzle";
import { ilike, like, notIlike, notLike } from "drizzle-orm";
import { createDatabaseAdapter, defaultBeginTransaction } from "payload";

import type { Args, MySQLAdapter } from "./types.js";
import { columnToCodeConverter } from "./columnToCodeConverter.js";
import { connect } from "./connect.js";
import { countDistinct } from "./countDistinct.js";
import { convertPathToJSONTraversal } from "./createJSONQuery/convertPathToJSONTraversal.js";
import { createJSONQuery } from "./createJSONQuery/index.js";
import { defaultDrizzleSnapshot } from "./defaultSnapshot.js";
import { deleteWhere } from "./deleteWhere.js";
import { dropDatabase } from "./dropDatabase.js";
import { execute } from "./execute.js";
import { init } from "./init.js";
import { insert } from "./insert.js";
import { requireDrizzleKit } from "./requireDrizzleKit.js";

export type { MigrateDownArgs, MigrateUpArgs } from "./types.js";

export { sql } from "drizzle-orm";

const filename = fileURLToPath(import.meta.url);

export function mysqlAdapter(args: Args): DatabaseAdapterObj<MySQLAdapter> {
  const mysqlIDType = args.idType || "number";
  const payloadIDType = mysqlIDType === "uuid" ? "text" : "number";
  const allowIDOnCreate = args.allowIDOnCreate ?? false;

  function adapter({ payload }: { payload: Payload }) {
    const migrationDir = findMigrationDir(args.migrationDir);
    let resolveInitializing;
    let rejectInitializing;

    const initializing = new Promise<void>((res, rej) => {
      resolveInitializing = res;
      rejectInitializing = rej;
    });

    // MySQL operators for case-sensitive and case-insensitive comparisons
    const operators = {
      ...operatorMap,
      contains: ilike,
      like,
      not_like: notLike,
      ilike,
      not_ilike: notIlike,
    } as unknown as Operators;

    return createDatabaseAdapter<MySQLAdapter>({
      name: "mysql",
      afterSchemaInit: args.afterSchemaInit ?? [],
      allowIDOnCreate,
      autoIncrement: args.autoIncrement ?? false,
      beforeSchemaInit: args.beforeSchemaInit ?? [],
      // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
      client: undefined,
      clientConfig: args.client,
      collections: {},
      defaultDrizzleSnapshot,
      // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
      drizzle: undefined,
      features: {
        json: true,
      },
      fieldConstraints: {},
      generateSchema: createSchemaGenerator({
        columnToCodeConverter,
        corePackageSuffix: "mysql-core",
        defaultOutputFile: args.generateSchemaOutputFile,
        tableImport: "mysqlTable",
      }),
      idType: mysqlIDType,
      initializing,
      localesSuffix: args.localesSuffix || "_locales",
      logger: args.logger,
      operators,
      prodMigrations: args.prodMigrations,
      // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
      push: args.push,
      rawRelations: {},
      rawTables: {},
      relations: {},
      relationshipsSuffix: args.relationshipsSuffix || "_rels",
      schema: {},
      schemaName: args.schemaName,
      sessions: {},
      tableNameMap: new Map<string, string>(),
      tablePrefix: "", // Add empty table prefix by default
      tables: {},
      // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
      transactionOptions: args.transactionOptions || undefined,
      updateJobs,
      updateMany,
      versionsSuffix: args.versionsSuffix || "_v",

      // DatabaseAdapter
      beginTransaction: args.transactionOptions
        ? beginTransaction
        : defaultBeginTransaction(),
      commitTransaction,
      connect,
      convertPathToJSONTraversal,
      count,
      countDistinct,
      countGlobalVersions,
      countVersions,
      create,
      createGlobal,
      createGlobalVersion,
      createJSONQuery,
      createMigration: buildCreateMigration({
        executeMethod: "query",
        filename,
        sanitizeStatements({ sqlExecute, statements }) {
          return statements
            .map(
              (statement) =>
                `${sqlExecute}${statement?.replaceAll("`", "\\`")}\`)`,
            )
            .join("\n");
        },
      }),
      createVersion,
      defaultIDType: payloadIDType,
      deleteMany,
      deleteOne,
      deleteVersions,
      deleteWhere,
      destroy,
      dropDatabase,
      execute,
      find,
      findGlobal,
      findGlobalVersions,
      // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
      findOne,
      findVersions,
      indexes: new Set<string>(),
      init,
      insert,
      migrate,
      migrateDown,
      migrateFresh,
      migrateRefresh,
      migrateReset,
      migrateStatus,
      migrationDir,
      packageName: "@payloadcmsdirectory/db-sql",
      payload,
      queryDrafts,
      // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
      rejectInitializing,
      requireDrizzleKit,
      // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
      resolveInitializing,
      rollbackTransaction,
      updateGlobal,
      updateGlobalVersion,
      updateOne,
      updateVersion,
      upsert: updateOne,
    });
  }

  return {
    allowIDOnCreate,
    defaultIDType: payloadIDType,
    init: adapter,
  };
}
