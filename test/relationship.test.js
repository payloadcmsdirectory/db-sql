// Test relationship functionality of the MySQL adapter
import mysql from "mysql2/promise";

describe("MySQL relationship functionality", () => {
  let pool;
  const prefix = "pl_";

  // Table names
  const usersTable = `${prefix}users`;
  const postsTable = `${prefix}posts`;
  const categoriesTable = `${prefix}categories`;
  const postsCategsTable = `${prefix}posts_categories_rels`;

  // IDs to track created entities
  let userId;
  let postId;
  let categoryIds = [];

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

    // Drop tables if they exist (in reverse order to avoid foreign key constraints)
    await pool.query(`DROP TABLE IF EXISTS ${postsCategsTable}`);
    await pool.query(`DROP TABLE IF EXISTS ${postsTable}`);
    await pool.query(`DROP TABLE IF EXISTS ${usersTable}`);
    await pool.query(`DROP TABLE IF EXISTS ${categoriesTable}`);

    // Create users table
    await pool.query(`
      CREATE TABLE ${usersTable} (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create categories table
    await pool.query(`
      CREATE TABLE ${categoriesTable} (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create posts table with a relationship to users
    await pool.query(`
      CREATE TABLE ${postsTable} (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT,
        publishDate DATETIME,
        author BIGINT,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create posts-categories relationship table
    await pool.query(`
      CREATE TABLE ${postsCategsTable} (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        post_id BIGINT NOT NULL,
        category_id BIGINT NOT NULL,
        KEY \`post_id\` (\`post_id\`),
        KEY \`category_id\` (\`category_id\`)
      )
    `);
  });

  afterAll(async () => {
    if (pool) {
      // Drop tables in reverse order
      await pool.query(`DROP TABLE IF EXISTS ${postsCategsTable}`);
      await pool.query(`DROP TABLE IF EXISTS ${postsTable}`);
      await pool.query(`DROP TABLE IF EXISTS ${usersTable}`);
      await pool.query(`DROP TABLE IF EXISTS ${categoriesTable}`);

      // Close pool
      await pool.end();
    }
  });

  test("should connect to MySQL database", async () => {
    const [rows] = await pool.query("SELECT 1 as value");
    expect(rows[0].value).toBe(1);
  });

  test("should create a user", async () => {
    // Create test user
    const [result] = await pool.query(
      `INSERT INTO ${usersTable} (email, name) VALUES (?, ?)`,
      ["test@example.com", "Test User"],
    );

    userId = result.insertId;

    // Verify the user was created
    expect(userId).toBeDefined();
    expect(userId).toBeGreaterThan(0);

    // Verify user can be retrieved
    const [userRows] = await pool.query(
      `SELECT * FROM ${usersTable} WHERE id = ?`,
      [userId],
    );

    expect(userRows.length).toBe(1);
    expect(userRows[0].email).toBe("test@example.com");
    expect(userRows[0].name).toBe("Test User");
  });

  test("should create categories", async () => {
    // Create first category
    const [cat1Result] = await pool.query(
      `INSERT INTO ${categoriesTable} (name) VALUES (?)`,
      ["Technology"],
    );

    // Create second category
    const [cat2Result] = await pool.query(
      `INSERT INTO ${categoriesTable} (name) VALUES (?)`,
      ["Programming"],
    );

    categoryIds = [cat1Result.insertId, cat2Result.insertId];

    // Verify categories were created
    expect(categoryIds.length).toBe(2);
    expect(categoryIds[0]).toBeGreaterThan(0);
    expect(categoryIds[1]).toBeGreaterThan(0);

    // Verify categories can be retrieved
    const [categoryRows] = await pool.query(
      `SELECT * FROM ${categoriesTable} WHERE id IN (?, ?)`,
      categoryIds,
    );

    expect(categoryRows.length).toBe(2);
    expect(categoryRows[0].name).toBe("Technology");
    expect(categoryRows[1].name).toBe("Programming");
  });

  test("should create a post with relationship to user", async () => {
    // Create test post
    const [result] = await pool.query(
      `INSERT INTO ${postsTable} (title, content, publishDate, author) VALUES (?, ?, ?, ?)`,
      ["Test Post", "This is a test post content", new Date(), userId],
    );

    postId = result.insertId;

    // Verify the post was created
    expect(postId).toBeDefined();
    expect(postId).toBeGreaterThan(0);

    // Verify post can be retrieved with author relationship
    const [postRows] = await pool.query(
      `
      SELECT p.*, u.name as author_name 
      FROM ${postsTable} p
      LEFT JOIN ${usersTable} u ON p.author = u.id
      WHERE p.id = ?
      `,
      [postId],
    );

    expect(postRows.length).toBe(1);
    expect(postRows[0].title).toBe("Test Post");
    expect(postRows[0].author).toBe(userId);
    expect(postRows[0].author_name).toBe("Test User");
  });

  test("should create many-to-many relationships", async () => {
    // Create post-category relationships
    for (const categoryId of categoryIds) {
      await pool.query(
        `INSERT INTO ${postsCategsTable} (post_id, category_id) VALUES (?, ?)`,
        [postId, categoryId],
      );
    }

    // Verify relationships can be queried
    const [relationRows] = await pool.query(
      `SELECT * FROM ${postsCategsTable} WHERE post_id = ?`,
      [postId],
    );

    expect(relationRows.length).toBe(2);
    expect(relationRows[0].post_id).toBe(postId);
    expect(relationRows[1].post_id).toBe(postId);
    expect(relationRows.map((r) => r.category_id)).toEqual(
      expect.arrayContaining(categoryIds),
    );
  });

  test("should query post with all relationships", async () => {
    // Query post with author
    const [postWithAuthor] = await pool.query(
      `
      SELECT p.*, u.name as author_name 
      FROM ${postsTable} p
      LEFT JOIN ${usersTable} u ON p.author = u.id
      WHERE p.id = ?
      `,
      [postId],
    );

    // Query categories for the post
    const [postCategories] = await pool.query(
      `
      SELECT c.* 
      FROM ${categoriesTable} c
      JOIN ${postsCategsTable} r ON c.id = r.category_id
      WHERE r.post_id = ?
      `,
      [postId],
    );

    // Verify post with author
    expect(postWithAuthor.length).toBe(1);
    expect(postWithAuthor[0].title).toBe("Test Post");
    expect(postWithAuthor[0].author_name).toBe("Test User");

    // Verify post categories
    expect(postCategories.length).toBe(2);
    expect(postCategories.map((c) => c.name)).toEqual(
      expect.arrayContaining(["Technology", "Programming"]),
    );
  });

  test("should delete a relationship", async () => {
    // Delete one relationship
    await pool.query(
      `DELETE FROM ${postsCategsTable} WHERE post_id = ? AND category_id = ?`,
      [postId, categoryIds[0]],
    );

    // Verify relationship was deleted
    const [remainingRels] = await pool.query(
      `SELECT * FROM ${postsCategsTable} WHERE post_id = ?`,
      [postId],
    );

    expect(remainingRels.length).toBe(1);
    expect(remainingRels[0].category_id).toBe(categoryIds[1]);
  });
});
