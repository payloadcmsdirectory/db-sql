import type { Pool } from "mysql2/promise";
import mysql from "mysql2/promise";

import type { SQLAdapterOptions } from "./types";

/**
 * Create and test a MySQL connection
 */
export const connect = async (options: SQLAdapterOptions): Promise<Pool> => {
  try {
    // Create the connection pool
    const pool = mysql.createPool({
      host: options.host,
      user: options.user,
      password: options.password,
      database: options.database,
      port: options.port || 3306,
    });

    // Test the connection
    const connection = await pool.getConnection();
    connection.release();

    console.info("Successfully connected to MySQL database");
    return pool;
  } catch (error) {
    console.error("Failed to connect to MySQL database:", error);
    throw error;
  }
};
