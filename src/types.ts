import type { Config } from "@libsql/client";
import type { extendDrizzleTable, Operators } from "@payloadcms/drizzle";
import type {
  BuildQueryJoinAliases,
  DrizzleAdapter,
} from "@payloadcms/drizzle/types";
import type { DrizzleConfig, Relation, Relations, SQL } from "drizzle-orm";
import type {
  AnyMySqlColumn,
  MySqlDatabase,
  MySqlInsertConfig,
  MySqlTableWithColumns,
  MySqlTransactionConfig,
} from "drizzle-orm/mysql-core";
import type { Pool } from "mysql2/promise";
import type { Payload, PayloadRequest } from "payload";
import { MySql2Database } from "drizzle-orm/mysql2";

type MySQLSchema = {
  relations: Record<string, GenericRelation>;
  tables: Record<string, MySqlTableWithColumns<any>>;
};

type MySQLSchemaHookArgs = {
  extendTable: typeof extendDrizzleTable;
  schema: MySQLSchema;
};

export type MySQLSchemaHook = (
  args: MySQLSchemaHookArgs,
) => Promise<MySQLSchema> | MySQLSchema;

export type Args = {
  /**
   * Transform the schema after it's built.
   * You can use it to customize the schema with features that aren't supported by Payload.
   * Examples may include: composite indices, generated columns, vectors
   */
  afterSchemaInit?: MySQLSchemaHook[];
  /**
   * Enable this flag if you want to thread your own ID to create operation data, for example:
   * ```ts
   * // doc created with id 1
   * const doc = await payload.create({ collection: 'posts', data: {id: 1, title: "my title"}})
   * ```
   */
  allowIDOnCreate?: boolean;
  /**
   * Enable AUTO_INCREMENT for Primary Keys.
   * This ensures that the same ID cannot be reused from previously deleted rows.
   */
  autoIncrement?: boolean;
  /**
   * Transform the schema before it's built.
   * You can use it to preserve an existing database schema and if there are any collissions Payload will override them.
   * To generate Drizzle schema from the database, see [Drizzle Kit introspection](https://orm.drizzle.team/kit-docs/commands#introspect--pull)
   */
  beforeSchemaInit?: MySQLSchemaHook[];
  client: {
    pool: {
      host: string;
      user: string;
      password: string;
      database: string;
      port?: number;
    };
  };
  /** Generated schema from payload generate:db-schema file path */
  generateSchemaOutputFile?: string;
  idType?: "number" | "uuid";
  localesSuffix?: string;
  logger?: DrizzleConfig["logger"];
  migrationDir?: string;
  prodMigrations?: {
    down: (args: MigrateDownArgs) => Promise<void>;
    name: string;
    up: (args: MigrateUpArgs) => Promise<void>;
  }[];
  push?: boolean;
  relationshipsSuffix?: string;
  schemaName?: string;
  transactionOptions?: false | MySqlTransactionConfig;
  versionsSuffix?: string;
};

export type GenericColumns = {
  [x: string]: AnyMySqlColumn;
};

export type GenericTable = MySqlTableWithColumns<{
  columns: GenericColumns;
  dialect: string;
  name: string;
  schema: string;
}>;

export type GenericRelation = Relations<
  string,
  Record<string, Relation<string>>
>;

export type CountDistinct = (args: {
  db: MySql2Database;
  joins: BuildQueryJoinAliases;
  tableName: string;
  where: SQL;
}) => Promise<number>;

export type DeleteWhere = (args: {
  db: MySql2Database;
  tableName: string;
  where: SQL;
}) => Promise<void>;

export type DropDatabase = (args: { adapter: MySQLAdapter }) => Promise<void>;

export type Execute<T> = (args: {
  db?: MySql2Database;
  drizzle?: MySql2Database;
  raw?: string;
  sql?: SQL<unknown>;
}) => SQL<Promise<T>>;

export type Insert = (args: {
  db: MySql2Database;
  onConflictDoUpdate?: any;
  tableName: string;
  values: Record<string, unknown> | Record<string, unknown>[];
}) => Promise<Record<string, unknown>[]>;

// Explicitly omit drizzle property for complete override in MySQLAdapter, required in ts 5.5
type MySQLDrizzleAdapter = Omit<
  DrizzleAdapter,
  | "countDistinct"
  | "deleteWhere"
  | "drizzle"
  | "dropDatabase"
  | "execute"
  | "idType"
  | "insert"
  | "operators"
  | "relations"
>;

export interface GeneratedDatabaseSchema {
  schemaUntyped: Record<string, unknown>;
}

type ResolveSchemaType<T> = "schema" extends keyof T
  ? T["schema"]
  : GeneratedDatabaseSchema["schemaUntyped"];

type Drizzle = { $client: Pool } & MySqlDatabase<any, any, any, any>;

export type RequireDrizzleKit = {
  generateDrizzleJson: (
    args: Record<string, unknown>,
  ) => Record<string, unknown>;
  generateMigration: (args: Record<string, unknown>) => Promise<unknown>;
  pushSchema: (args: Record<string, unknown>) => Promise<unknown>;
};

export type TypeWithID = {
  id: string | number;
  [key: string]: any;
};

export type Field = {
  name: string;
  type: string;
  relationTo?: string | string[];
  hasMany?: boolean;
  [key: string]: any;
};

export type MySQLAdapter = {
  afterSchemaInit: MySQLSchemaHook[];
  autoIncrement: boolean;
  beforeSchemaInit: MySQLSchemaHook[];
  client: Pool;
  clientConfig: Args["client"];
  collections: Record<string, { fields: Field[] }>;
  countDistinct: CountDistinct;
  defaultDrizzleSnapshot: any;
  deleteWhere: DeleteWhere;
  drizzle: Drizzle;
  dropDatabase: DropDatabase;
  execute: Execute<unknown>;
  /**
   * An object keyed on each table, with a key value pair where the constraint name is the key, followed by the dot-notation field name
   * Used for returning properly formed errors from unique fields
   */
  fieldConstraints: Record<string, Record<string, string>>;
  idType: Args["idType"];
  initializing: Promise<void>;
  insert: Insert;
  localesSuffix?: string;
  logger: DrizzleConfig["logger"];
  operators: Operators;
  prodMigrations?: {
    down: (args: MigrateDownArgs) => Promise<void>;
    name: string;
    up: (args: MigrateUpArgs) => Promise<void>;
  }[];
  push: boolean;
  rejectInitializing: () => void;
  relations: Record<string, GenericRelation>;
  relationshipsSuffix?: string;
  resolveInitializing: () => void;
  schema: Record<string, GenericRelation | GenericTable>;
  schemaName?: Args["schemaName"];
  tableNameMap: Map<string, string>;
  tablePrefix: string;
  tables: Record<string, GenericTable>;
  transactionOptions: MySqlTransactionConfig;
  versionsSuffix?: string;
} & MySQLDrizzleAdapter;

export type IDType = "integer" | "numeric" | "text";

export type MigrateUpArgs = {
  /**
   * The MySQL Drizzle instance that you can use to execute SQL directly within the current transaction.
   * @example
   * ```ts
   * import { type MigrateUpArgs, sql } from '@payloadcmsdirectory/db-sql'
   *
   * export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
   *   const posts = await db.execute(sql`SELECT * FROM posts`);
   * }
   * ```
   */
  db: Drizzle;
  /**
   * The Payload instance that you can use to execute Local API methods
   * To use the current transaction you must pass `req` to arguments
   * @example
   * ```ts
   * import { type MigrateUpArgs } from '@payloadcmsdirectory/db-sql'
   *
   * export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
   *   const posts = await payload.find({ collection: 'posts', req })
   * }
   * ```
   */
  payload: Payload;
  /**
   * The `PayloadRequest` object that contains the current transaction
   */
  req: PayloadRequest;
};

export type MigrateDownArgs = {
  /**
   * The MySQL Drizzle instance that you can use to execute SQL directly within the current transaction.
   * @example
   * ```ts
   * import { type MigrateDownArgs, sql } from '@payloadcmsdirectory/db-sql'
   *
   * export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
   *   const posts = await db.execute(sql`SELECT * FROM posts`);
   * }
   * ```
   */
  db: Drizzle;
  /**
   * The Payload instance that you can use to execute Local API methods
   * To use the current transaction you must pass `req` to arguments
   * @example
   * ```ts
   * import { type MigrateDownArgs } from '@payloadcmsdirectory/db-sql'
   *
   * export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
   *   const posts = await payload.find({ collection: 'posts', req })
   * }
   * ```
   */
  payload: Payload;
  /**
   * The `PayloadRequest` object that contains the current transaction
   */
  req: PayloadRequest;
};

declare module "payload" {
  export interface DatabaseAdapter
    extends Omit<Args, "idType" | "logger" | "migrationDir" | "pool">,
      DrizzleAdapter {
    beginTransaction: (
      options?: MySqlTransactionConfig,
    ) => Promise<null | number | string>;
    drizzle: Drizzle;
    /**
     * An object keyed on each table, with a key value pair where the constraint name is the key, followed by the dot-notation field name
     * Used for returning properly formed errors from unique fields
     */
    fieldConstraints: Record<string, Record<string, string>>;
    idType: Args["idType"];
    initializing: Promise<void>;
    localesSuffix?: string;
    logger: DrizzleConfig["logger"];
    prodMigrations?: {
      down: (args: MigrateDownArgs) => Promise<void>;
      name: string;
      up: (args: MigrateUpArgs) => Promise<void>;
    }[];
    push: boolean;
    rejectInitializing: () => void;
    relationshipsSuffix?: string;
    resolveInitializing: () => void;
    schema: Record<string, GenericRelation | GenericTable>;
    tableNameMap: Map<string, string>;
    transactionOptions: MySqlTransactionConfig;
    versionsSuffix?: string;
  }
}
