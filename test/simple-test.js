// A simple test to check MySQL connectivity
import mysql from "mysql2/promise";

async function runTest() {
  console.log("MySQL connection test started");

  let connection;
  try {
    // Create a connection pool
    const pool = await mysql.createPool({
      host: "localhost",
      user: "root",
      password: "rootpassword",
      database: "payload_test",
      port: 3306,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    console.log("Successfully created MySQL connection pool");

    // Test the connection
    console.log("Testing query execution...");
    const [rows] = await pool.query("SHOW TABLES");
    console.log("Tables:", rows);

    // Close pool
    await pool.end();
    console.log("Connection pool closed");
    console.log("Test completed successfully");
  } catch (error) {
    console.error("Test failed:", error);
  }
}

runTest()
  .then(() => console.log("Test finished"))
  .catch((error) => console.error("Unhandled error:", error));
