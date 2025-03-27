import type { Pool } from "mysql2/promise";
import type { DatabaseAdapter, Payload } from "payload";

/**
 * Options for the SQL adapter
 */
export interface SQLAdapterOptions {
  /**
   * MySQL/MariaDB host
   */
  host: string;

  /**
   * Database user
   */
  user: string;

  /**
   * Database password
   */
  password: string;

  /**
   * Database name
   */
  database: string;

  /**
   * Database port (default: 3306)
   */
  port?: number;

  /**
   * Table prefix (default: '')
   */
  tablePrefix?: string;

  /**
   * Enable verbose logging
   */
  debug?: boolean;

  /**
   * Drop all tables on initialization (development only)
   */
  dropDatabase?: boolean;
}

/**
 * Extended DatabaseAdapter with SQL-specific functionality
 */
export interface SQLAdapter extends DatabaseAdapter {
  /**
   * Reference to the Payload instance
   */
  payload: Payload;

  /**
   * Pool of MySQL connections
   */
  pool: Pool;

  /**
   * Table prefix for SQL tables
   */
  tablePrefix: string;

  /**
   * Enable debug mode
   */
  debug: boolean;

  /**
   * Connection method
   */
  connect: () => Promise<void>;

  /**
   * Registry of Drizzle tables
   */
  tables: Record<string, any>;

  /**
   * Optional resolvers for async initialization
   */
  resolveInitializing?: () => void;
  rejectInitializing?: (error: Error) => void;
}

/**
 * Raw column definition for schema building
 */
export interface RawColumn {
  name: string;
  type: string;
  primaryKey?: boolean;
  notNull?: boolean;
  autoIncrement?: boolean;
  defaultNow?: boolean;
  defaultRandom?: boolean;
  default?: any;
  length?: number;
  options?: string[];
}

/**
 * Raw index definition for schema building
 */
export interface RawIndex {
  name: string;
  columns: string[];
  unique?: boolean;
}

/**
 * Raw table definition for schema building
 */
export interface RawTable {
  name: string;
  columns: Record<string, RawColumn>;
  indexes?: RawIndex[];
}

/**
 * Args for buildDrizzleTable
 */
export interface BuildDrizzleTableArgs {
  adapter: any;
  tableName: string;
  tableConfig: RawTable;
}

/**
 * Args for setColumnID
 */
export interface SetColumnIDArgs {
  idType: "number" | "uuid" | string;
  autoIncrement?: boolean;
}
