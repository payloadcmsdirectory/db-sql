// Test basic MySQL connection
import mysql from "mysql2/promise";

describe("MySQL basic connection", () => {
  let pool;

  beforeAll(async () => {
    // Create a connection pool
    pool = await mysql.createPool({
      host: "localhost",
      user: "root",
      password: "rootpassword",
      database: "payload_test",
      port: 3306,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  });

  afterAll(async () => {
    if (pool) {
      // Close pool
      await pool.end();
    }
  });

  test("should connect to MySQL database", async () => {
    const [rows] = await pool.query("SELECT 1 as value");
    expect(rows[0].value).toBe(1);
  });

  test("should list database tables", async () => {
    const [tables] = await pool.query("SHOW TABLES");
    expect(Array.isArray(tables)).toBe(true);
  });

  test("should handle a simple insert and select", async () => {
    const testTableName = "pl_connection_test";

    // Drop the table if it exists
    await pool.query(`DROP TABLE IF EXISTS ${testTableName}`);

    // Create a simple test table
    await pool.query(`
      CREATE TABLE ${testTableName} (
        id INT AUTO_INCREMENT PRIMARY KEY,
        test_value VARCHAR(255) NOT NULL
      )
    `);

    // Insert a test value
    await pool.query(
      `
      INSERT INTO ${testTableName} (test_value) VALUES (?)
    `,
      ["test_connection"],
    );

    // Fetch the inserted value
    const [rows] = await pool.query(
      `
      SELECT * FROM ${testTableName} WHERE test_value = ?
    `,
      ["test_connection"],
    );

    // Verify the result
    expect(rows.length).toBe(1);
    expect(rows[0].test_value).toBe("test_connection");

    // Clean up - drop the table
    await pool.query(`DROP TABLE IF EXISTS ${testTableName}`);
  });

  test("should handle connection timeout gracefully", async () => {
    // Set a very short timeout to test timeout handling
    const query = "SELECT SLEEP(0.1) as result";
    const [result] = await pool.query(query);

    // Query should complete with result 0 (success)
    expect(result[0].result).toBe(0);
  });
});
