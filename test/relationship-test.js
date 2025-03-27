const mysql = require("mysql2/promise");

async function testRelationships() {
  console.log("Starting Relationship Test...");

  // Database configuration
  const dbConfig = {
    host: "localhost",
    user: "root",
    password: "rootpassword",
    database: "payload_test",
    port: 3306,
  };

  // Table prefix
  const prefix = "pl_";
  let pool;

  try {
    // Connect to the database
    console.log("Connecting to database...");
    pool = await mysql.createPool(dbConfig);
    console.log("✅ Connected successfully");

    // Create tables directly using SQL
    console.log("Creating test tables...");

    // Drop existing tables if they exist
    await pool.query(`DROP TABLE IF EXISTS \`${prefix}posts_categories_rels\``);
    await pool.query(`DROP TABLE IF EXISTS \`${prefix}posts\``);
    await pool.query(`DROP TABLE IF EXISTS \`${prefix}users\``);
    await pool.query(`DROP TABLE IF EXISTS \`${prefix}categories\``);

    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`${prefix}users\` (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create categories table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`${prefix}categories\` (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create posts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`${prefix}posts\` (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT,
        publishDate DATETIME,
        author BIGINT,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create relationship table for posts/categories
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`${prefix}posts_categories_rels\` (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        post_id BIGINT NOT NULL,
        category_id BIGINT NOT NULL,
        KEY \`post_id\` (\`post_id\`),
        KEY \`category_id\` (\`category_id\`)
      )
    `);

    console.log("✅ Tables created");

    // Create a test user
    console.log("Creating test user...");
    const [userResult] = await pool.query(
      `
      INSERT INTO \`${prefix}users\` (email, name) VALUES (?, ?)
    `,
      ["test@example.com", "Test User"],
    );

    const userId = userResult.insertId;
    console.log("✅ Created user with ID:", userId);

    // Create multiple test categories
    console.log("Creating test categories...");
    const [cat1Result] = await pool.query(
      `
      INSERT INTO \`${prefix}categories\` (name) VALUES (?)
    `,
      ["Technology"],
    );

    const [cat2Result] = await pool.query(
      `
      INSERT INTO \`${prefix}categories\` (name) VALUES (?)
    `,
      ["Programming"],
    );

    const categoryIds = [cat1Result.insertId, cat2Result.insertId];
    console.log("✅ Created categories with IDs:", categoryIds);

    // Create a test post with relationships
    console.log("Creating test post...");
    const [postResult] = await pool.query(
      `
      INSERT INTO \`${prefix}posts\` (title, content, publishDate, author) VALUES (?, ?, ?, ?)
    `,
      ["Test Post", "This is a test post content", new Date(), userId],
    );

    const postId = postResult.insertId;
    console.log("✅ Created post with ID:", postId);

    // Create post-category relationships
    console.log("Creating relationships...");
    for (const categoryId of categoryIds) {
      await pool.query(
        `
        INSERT INTO \`${prefix}posts_categories_rels\` (post_id, category_id) VALUES (?, ?)
      `,
        [postId, categoryId],
      );
    }
    console.log("✅ Created relationships");

    // Test relationship queries
    console.log("Testing queries...");

    // Query 1: Get post with author
    const [postWithAuthor] = await pool.query(
      `
      SELECT p.*, u.name as author_name 
      FROM \`${prefix}posts\` p
      LEFT JOIN \`${prefix}users\` u ON p.author = u.id
      WHERE p.id = ?
    `,
      [postId],
    );

    // Query 2: Get categories for post
    const [postCategories] = await pool.query(
      `
      SELECT c.* 
      FROM \`${prefix}categories\` c
      JOIN \`${prefix}posts_categories_rels\` r ON c.id = r.category_id
      WHERE r.post_id = ?
    `,
      [postId],
    );

    // Query 3: Count categories per post
    const [categoryCounts] = await pool.query(`
      SELECT r.post_id, COUNT(r.category_id) as category_count
      FROM \`${prefix}posts_categories_rels\` r
      GROUP BY r.post_id
    `);

    console.log("✅ Post with author:", postWithAuthor[0]);
    console.log("✅ Post categories:", postCategories);
    console.log("✅ Category counts:", categoryCounts);

    console.log("Test completed successfully!");
  } catch (error) {
    console.error("❌ Test failed with error:", error);
  } finally {
    // Close the connection
    if (pool) {
      console.log("Closing connection...");
      await pool.end();
      console.log("Connection closed");
    }
  }
}

// Run the test
testRelationships().catch(console.error);
