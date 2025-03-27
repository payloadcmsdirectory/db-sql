import type { MySqlDatabase, MySqlTable } from "drizzle-orm/mysql-core";
import type { Pool, PoolConnection } from "mysql2/promise";

import type { DatabaseAdapter } from "payload";

/**
 * Simplified type definitions
 */
export type PayloadRequest = Record<string, any>;

export type TypeWithID = {
  id: string | number;
  [key: string]: any;
};

export type Collection = {
  slug: string;
  fields?: Field[];
  [key: string]: any;
};

export type CollectionConfig = {
  slug: string;
  fields: Field[];
  [key: string]: any;
};

export type Field = {
  name: string;
  type: string;
  required?: boolean;
  unique?: boolean;
  localized?: boolean;
  index?: boolean;
  defaultValue?: any;
  hasMany?: boolean;
  relationTo?: string | string[];
  maxDepth?: number;
  fields?: Field[];
  [key: string]: any;
};

export type CreateArgs = {
  collection: string;
  data: Record<string, any>;
  req?: PayloadRequest;
  draft?: boolean;
  [key: string]: any;
};

export type UpdateOneArgs = {
  collection: string;
  id: string | number;
  data: Record<string, any>;
  req?: PayloadRequest;
  [key: string]: any;
};

export type DeleteOneArgs = {
  collection: string;
  id: string | number;
  req?: PayloadRequest;
  [key: string]: any;
};

export type FindArgs = {
  collection: string;
  limit?: number;
  page?: number;
  sort?: string | string[];
  where?: Where;
  depth?: number;
  req?: PayloadRequest;
  [key: string]: any;
};

export type FindOneArgs = {
  collection: string;
  where: Where;
  depth?: number;
  req?: PayloadRequest;
  [key: string]: any;
};

export type Where = {
  [key: string]: WhereField | Where;
};

export type WhereField = {
  equals?: any;
  not_equals?: any;
  greater_than?: number | string;
  greater_than_equal?: number | string;
  less_than?: number | string;
  less_than_equal?: number | string;
  like?: string;
  contains?: string;
  in?: any[];
  not_in?: any[];
  exists?: boolean;
  [key: string]: any;
};

export type PaginatedDocs<T extends TypeWithID = any> = {
  docs: T[];
  totalDocs: number;
  limit: number;
  totalPages: number;
  page: number;
  pagingCounter: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  prevPage: number | null;
  nextPage: number | null;
};

/**
 * SQL Adapter types
 */
export interface SQLAdapterOptions {
  pool: {
    host: string;
    user: string;
    password: string;
    database: string;
    port?: number;
  };
  prefix?: string;
}

export interface SQLAdapter {
  db: MySqlDatabase<any, any>;
  collections: Record<string, Collection>;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  create: (args: CreateArgs) => Promise<any>;
  createCollection: (args: CollectionConfig) => Promise<void>;
  delete: (args: DeleteOneArgs) => Promise<void>;
  find: <T extends TypeWithID = any>(
    args: FindArgs,
  ) => Promise<PaginatedDocs<T>>;
  findOne: <T extends TypeWithID = any>(args: FindOneArgs) => Promise<T>;
  findByID: <T extends TypeWithID = any>(args: {
    collection: string;
    id: string | number;
    depth?: number;
    req?: PayloadRequest;
  }) => Promise<T>;
  update: (args: UpdateOneArgs) => Promise<any>;
  processRelationships?: <T extends TypeWithID = any>(
    collection: string,
    fields: Field[],
    doc: T,
    depth?: number,
    req?: any,
  ) => Promise<T>;
}

/**
 * MySQL specific adapter type
 */
export interface MySQLAdapter extends SQLAdapter {
  client: Pool;
  tables: Record<string, MySqlTable>;
  tableNameMap: Map<string, string>;
  tablePrefix: string;
  transactionClient?: PoolConnection;

  /**
   * Drizzle ORM instance
   */
  drizzle?: any;

  /**
   * Client connection configuration
   */
  clientConfig?: {
    pool: {
      host: string;
      user: string;
      password: string;
      database: string;
      port?: number;
    };
  };

  /**
   * Payload instance
   */
  payload?: {
    logger: {
      info: (message: string) => void;
      error: (message: string, error?: Error) => void;
    };
  };

  /**
   * Resolve function for initialization promise
   */
  resolveInitializing?: () => void;

  /**
   * Reject function for initialization promise
   */
  rejectInitializing?: (error: Error) => void;

  /**
   * Schema generation utilities
   */
  generateSchema?: {
    columnToCodeConverter: any;
  };

  /**
   * Hooks to run before schema initialization
   */
  beforeSchemaInit?: Array<
    (args: { adapter: MySQLAdapter }) => Promise<void> | void
  >;

  /**
   * Hooks to run after schema initialization
   */
  afterSchemaInit?: Array<
    (args: { adapter: MySQLAdapter }) => Promise<void> | void
  >;
}

/**
 * Raw schema definition types
 */
export interface RawColumn {
  name: string;
  type: string;
  required?: boolean;
  unique?: boolean;
  primary?: boolean;
  defaultValue?: any;
  length?: number;
  options?: string[];
  [key: string]: any;
}

export interface RawIndex {
  fields: string[];
  unique?: boolean;
  name?: string;
}

export interface RawTable {
  name: string;
  columns: RawColumn[];
  indexes?: RawIndex[];
  foreignKeys?: any[];
}

export interface BuildDrizzleTableArgs {
  adapter: SQLAdapter;
  tableName: string;
  tableConfig: RawTable;
}

export interface SetColumnIDArgs {
  idType?: "number" | "uuid" | string;
  autoIncrement?: boolean;
}

export interface Args extends MySQLAdapterArgs {
  autoIncrement?: boolean;
  /**
   * Skip schema validation on init
   */
  bypassSchemaValidation?: boolean;
  /**
   * Drizzle client for MySQL
   */
  client?: {
    pool: {
      host: string;
      user: string;
      password: string;
      database: string;
      port?: number;
    };
    /**
     * Table prefix (defaults to '')
     */
    prefix?: string;
  };
  /**
   * Location to write schema files
   */
  generateSchemaOutputFile?: string | false;
  /**
   * ID type for the database
   */
  idType?: "number" | "uuid";
  /**
   * Allow providing an ID on create
   */
  allowIDOnCreate?: boolean;
  /**
   * Location of Drizzle migrations. Defaults to `migrations` in the root of the project
   */
  migrationDir?: string;
  /**
   * Use DrizzleKit migrations in production. Default false.
   */
  prodMigrations?: boolean;
  /**
   * Options passed to push
   */
  push?: any;
  /**
   * Schema name
   */
  schemaName?: string;
  /**
   * Suffix for locales tables
   */
  localesSuffix?: string;
  /**
   * Suffix for versions tables
   */
  versionsSuffix?: string;
  /**
   * Suffix for relationship tables
   */
  relationshipsSuffix?: string;
  /**
   * Transaction options
   */
  transactionOptions?: any;
  /**
   * Logger
   */
  logger?: any;
  /**
   * Execute code after the schema is initialized
   */
  afterSchemaInit?: Array<
    (args: { adapter: MySQLAdapter }) => Promise<void> | void
  >;
  /**
   * Execute code before the schema is initialized
   */
  beforeSchemaInit?: Array<
    (args: { adapter: MySQLAdapter }) => Promise<void> | void
  >;
}

export interface MySQLAdapterArgs {}

export interface MigrateUpArgs {
  /**
   * Run all migrations
   */
  all?: boolean;
  /**
   * Run migrations up to a specific migration
   */
  to?: string;
}

export interface MigrateDownArgs {
  /**
   * Drop all tables and rerun all migrations
   */
  drop?: boolean;
  /**
   * Run migrations down to a specific migration
   */
  to?: string;
  /**
   * Run all down migrations
   */
  all?: boolean;
}
