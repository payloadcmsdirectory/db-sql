/**
 * Proxy to re-export MySQL-specific Drizzle ORM functionality
 * This allows us to potentially swap out the underlying implementation
 */

import type { MySqlPool, MySqlPoolConnection } from "drizzle-orm/mysql-core";
import { drizzle as drizzleORM } from "drizzle-orm/mysql2";

/**
 * Initialize Drizzle ORM with a MySQL connection pool
 */
export function drizzle(client: MySqlPool | MySqlPoolConnection) {
  return drizzleORM(client);
}

/**
 * MySQL timestamp placeholder for NOW()
 */
export const NOW = () => "NOW()";
