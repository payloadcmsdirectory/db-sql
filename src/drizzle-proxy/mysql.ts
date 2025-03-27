/**
 * Proxy to re-export MySQL-specific Drizzle ORM functionality
 * This allows us to potentially swap out the underlying implementation
 */

import type { Pool, PoolConnection } from "mysql2/promise";

import { drizzle as drizzleORM } from "drizzle-orm/mysql2";

/**
 * Create Drizzle ORM instance with MySQL connection
 */
export const drizzle = (pool: Pool) => {
  return drizzleORM(pool);
};

/**
 * MySQL timestamp placeholder for NOW()
 */
export const NOW = () => "NOW()";
