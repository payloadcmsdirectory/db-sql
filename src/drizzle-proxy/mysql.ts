/**
 * Proxy to re-export MySQL-specific Drizzle ORM functionality
 * This allows us to potentially swap out the underlying implementation
 */

export { drizzle } from "drizzle-orm/mysql2";
