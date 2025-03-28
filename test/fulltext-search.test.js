// Test fulltext search functionality of the MySQL adapter
import mysql from "mysql2/promise";

describe("MySQL fulltext search functionality", () => {
  let pool;
  const prefix = "pl_";
  const tableName = `${prefix}articles`;

  // Test articles with varied content
  const articles = [
    {
      title: "MySQL Performance Optimization",
      content:
        "This article covers MySQL performance optimization techniques for large databases.",
      tags: "database,performance,optimization,mysql",
    },
    {
      title: "React Components",
      content:
        "Building reusable React components with TypeScript and Jest testing.",
      tags: "react,typescript,frontend,testing",
    },
    {
      title: "Database Migrations",
      content:
        "How to handle MySQL database migrations safely in production environments.",
      tags: "database,mysql,migrations,devops",
    },
    {
      title: "Frontend UI Design",
      content: "Modern UI design principles for web applications.",
      tags: "design,ui,frontend,css",
    },
    {
      title: "SQL Query Performance",
      content:
        "Improving SQL query performance with proper indexing and query optimization.",
      tags: "sql,database,performance,mysql",
    },
  ];

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

    // Create test table with fulltext indexes
    await pool.query(`
      CREATE TABLE ${tableName} (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT,
        tags VARCHAR(255),
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FULLTEXT INDEX ft_content (content),
        FULLTEXT INDEX ft_title (title),
        FULLTEXT INDEX ft_tags (tags)
      )
    `);

    // Insert test data
    const insert = `
      INSERT INTO ${tableName} (title, content, tags)
      VALUES (?, ?, ?)
    `;

    // Insert all test articles
    for (const article of articles) {
      await pool.query(insert, [article.title, article.content, article.tags]);
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

  test("should find records using basic LIKE query", async () => {
    const [results] = await pool.query(
      `
      SELECT * FROM ${tableName}
      WHERE content LIKE ?
    `,
      ["%database%"],
    );

    // Should find at least 2 records (adjusted from 3)
    expect(results.length).toBeGreaterThanOrEqual(2);

    // Should include database-related articles
    const hasDatabaseArticle = results.some(
      (r) =>
        r.title.includes("Database") ||
        r.title.includes("SQL") ||
        r.title.includes("MySQL"),
    );
    expect(hasDatabaseArticle).toBe(true);
  });

  test("should find records using FULLTEXT search in natural language mode", async () => {
    const [results] = await pool.query(
      `
      SELECT *, MATCH(content) AGAINST(? IN NATURAL LANGUAGE MODE) as relevance
      FROM ${tableName}
      WHERE MATCH(content) AGAINST(? IN NATURAL LANGUAGE MODE)
      ORDER BY relevance DESC
    `,
      ["database performance", "database performance"],
    );

    // Should find at least 2 records
    expect(results.length).toBeGreaterThanOrEqual(2);

    // Check that all results have relevance score
    results.forEach((result) => {
      expect(result.relevance).toBeGreaterThan(0);
    });

    // Verify that the most relevant article is about databases
    expect(
      results[0].title.includes("Database") ||
        results[0].title.includes("SQL") ||
        results[0].title.includes("MySQL"),
    ).toBe(true);
  });

  test("should handle FULLTEXT search with boolean mode", async () => {
    const [results] = await pool.query(
      `
      SELECT * FROM ${tableName}
      WHERE MATCH(content) AGAINST(? IN BOOLEAN MODE)
    `,
      ["+mysql -react"],
    );

    // Should find articles with mysql but not react
    expect(results.length).toBeGreaterThan(0);

    // Should not include React Components article
    const hasReactComponents = results.some(
      (r) => r.title === "React Components",
    );
    expect(hasReactComponents).toBe(false);

    // Should include MySQL-related articles
    const hasMySQLArticle = results.some(
      (r) => r.title.includes("MySQL") || r.title.includes("SQL"),
    );
    expect(hasMySQLArticle).toBe(true);
  });

  test("should search across multiple columns with weighted relevance", async () => {
    const [results] = await pool.query(
      `
      SELECT *, 
        (MATCH(title) AGAINST(? IN BOOLEAN MODE) * 3 + 
         MATCH(content) AGAINST(? IN BOOLEAN MODE) * 2 + 
         MATCH(tags) AGAINST(? IN BOOLEAN MODE)) as relevance
      FROM ${tableName}
      WHERE MATCH(title) AGAINST(? IN BOOLEAN MODE)
         OR MATCH(content) AGAINST(? IN BOOLEAN MODE)
         OR MATCH(tags) AGAINST(? IN BOOLEAN MODE)
      ORDER BY relevance DESC
    `,
      ["mysql", "mysql", "mysql", "mysql", "mysql", "mysql"],
    );

    // Should find MySQL-related articles
    expect(results.length).toBeGreaterThan(0);

    // The most relevant should have MySQL in the title or content
    expect(
      results[0].title.includes("MySQL") ||
        results[0].title.includes("SQL") ||
        results[0].content.includes("MySQL"),
    ).toBe(true);

    // All results should have a relevance score
    results.forEach((result) => {
      expect(result.relevance).toBeGreaterThan(0);
    });
  });
});
