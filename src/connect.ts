import type { MySQLAdapter } from "./types";
import { drizzle } from "drizzle-orm/mysql2";
import type mysql from "mysql2/promise";

// Initialize MySQL connection and Drizzle ORM
export async function connect(this: MySQLAdapter): Promise<void> {
  // If the client is already defined, we don't need to connect again
  if (this.client) {
    return;
  }

  // Create a MySQL connection pool using the provided configuration
  try {
    const { createPool } = await import("mysql2/promise");
    const config = this.clientConfig;

    if (!config || !config.pool) {
      throw new Error("MySQL connection configuration is missing");
    }

    // Create the MySQL connection pool
    const pool = createPool({
      host: config.pool.host,
      user: config.pool.user,
      password: config.pool.password,
      database: config.pool.database,
      port: config.pool.port || 3306,
      // Useful settings for better stability
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      // Better JSON handling
      typeCast: function (field: any, next: () => any) {
        if (field.type === "JSON") {
          const value = field.string();
          if (value !== null) {
            return JSON.parse(value);
          }
        }
        return next();
      },
    });

    // Test the connection
    const connection = await pool.getConnection();
    connection.release();

    this.client = pool as mysql.Pool;
    this.drizzle = drizzle(pool);

    if (this.payload?.logger) {
      this.payload.logger.info(`Connected to MySQL: ${config.pool.database}`);
    }

    if (this.resolveInitializing) {
      this.resolveInitializing();
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (this.payload?.logger) {
      this.payload.logger.error(`Failed to connect to MySQL: ${errorMessage}`);
    }

    if (this.rejectInitializing) {
      this.rejectInitializing(
        error instanceof Error ? error : new Error(errorMessage),
      );
    }

    throw error;
  }
}
