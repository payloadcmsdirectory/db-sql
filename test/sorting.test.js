// Test sorting functionality of the MySQL adapter
import mysql from "mysql2/promise";

describe("MySQL sorting functionality", () => {
  let pool;
  const prefix = "pl_";
  const tableName = `${prefix}sortable_items`;

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

    // Drop test table if it exists
    await pool.query(`DROP TABLE IF EXISTS ${tableName}`);

    // Create test table with sortable fields
    await pool.query(`
      CREATE TABLE ${tableName} (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        orderNum INT NOT NULL,
        date_field DATE,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert test data with varying values
    const insert = `
      INSERT INTO ${tableName} (title, orderNum, date_field)
      VALUES (?, ?, ?)
    `;

    // Insert 10 items with reversed order to test sorting
    for (let i = 1; i <= 10; i++) {
      const dateValue = new Date(2024, 0, i);
      await pool.query(insert, [
        `Item ${11 - i}`,
        11 - i,
        dateValue.toISOString().split("T")[0],
      ]);
    }
  });

  afterAll(async () => {
    if (pool) {
      // Drop test table
      await pool.query(`DROP TABLE IF EXISTS ${tableName}`);
      // Close pool
      await pool.end();
    }
  });

  test("should connect to MySQL database", async () => {
    const [rows] = await pool.query("SELECT 1 as value");
    expect(rows[0].value).toBe(1);
  });

  test("should sort by numeric field ascending", async () => {
    const [results] = await pool.query(`
      SELECT * FROM ${tableName}
      ORDER BY orderNum ASC
    `);

    // Check if results are in ascending order
    for (let i = 0; i < results.length - 1; i++) {
      expect(results[i].orderNum).toBeLessThanOrEqual(results[i + 1].orderNum);
    }

    // Check first and last elements specifically
    expect(results[0].orderNum).toBe(1);
    expect(results[results.length - 1].orderNum).toBe(10);
  });

  test("should sort by text field descending", async () => {
    const [results] = await pool.query(`
      SELECT * FROM ${tableName}
      ORDER BY title DESC
    `);

    // Check if results are in descending order alphabetically
    for (let i = 0; i < results.length - 1; i++) {
      expect(results[i].title >= results[i + 1].title).toBe(true);
    }
  });

  test("should sort by date field ascending", async () => {
    const [results] = await pool.query(`
      SELECT * FROM ${tableName}
      ORDER BY date_field ASC
    `);

    // Check if dates are in ascending order
    for (let i = 0; i < results.length - 1; i++) {
      const date1 = new Date(results[i].date_field);
      const date2 = new Date(results[i + 1].date_field);
      expect(date1 <= date2).toBe(true);
    }

    // Check first and last dates
    expect(new Date(results[0].date_field).getMonth()).toBe(0); // January
    expect(new Date(results[0].date_field).getDate()).toBe(1); // 1st day

    expect(new Date(results[results.length - 1].date_field).getMonth()).toBe(0); // January
    expect(new Date(results[results.length - 1].date_field).getDate()).toBe(10); // 10th day
  });

  test("should sort by multiple fields", async () => {
    // First, create some records with the same orderNum but different titles
    await pool.query(
      `
      INSERT INTO ${tableName} (title, orderNum, date_field)
      VALUES (?, ?, ?)
    `,
      ["AAA Same Order", 5, "2024-02-01"],
    );

    await pool.query(
      `
      INSERT INTO ${tableName} (title, orderNum, date_field)
      VALUES (?, ?, ?)
    `,
      ["ZZZ Same Order", 5, "2024-02-02"],
    );

    // Now query with multi-field sorting
    const [results] = await pool.query(`
      SELECT * FROM ${tableName}
      WHERE orderNum = 5
      ORDER BY orderNum ASC, title ASC
    `);

    // Should have at least 3 records (1 original + 2 new ones)
    expect(results.length).toBeGreaterThanOrEqual(3);

    // The first one should be "AAA Same Order"
    expect(results[0].title).toBe("AAA Same Order");

    // The last one should be "ZZZ Same Order"
    expect(results[results.length - 1].title).toBe("ZZZ Same Order");
  });
});
