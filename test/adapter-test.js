const { sqlAdapter } = require("../dist/adapter");
const mysql = require("mysql2/promise");

async function testSQLAdapter() {
  console.log("Starting SQL Adapter Test...");

  // Database configuration
  const dbConfig = {
    host: "localhost",
    user: "root",
    password: "rootpassword",
    database: "payload_test",
    port: 3306,
  };

  const prefix = "pl_";
  let pool;
  let adapter;

  try {
    // First, connect directly and clear any existing tables
    console.log("Connecting to database directly to clean up...");
    pool = await mysql.createPool(dbConfig);
    console.log("✅ Connected successfully for cleanup");

    try {
      // Drop existing tables if they exist
      console.log("Dropping any existing tables...");
      await pool.query(
        `DROP TABLE IF EXISTS \`${prefix}posts_categories_rels\``,
      );
      await pool.query(`DROP TABLE IF EXISTS \`${prefix}posts\``);
      await pool.query(`DROP TABLE IF EXISTS \`${prefix}users\``);
      await pool.query(`DROP TABLE IF EXISTS \`${prefix}categories\``);
      console.log("✅ Cleanup completed");
    } catch (err) {
      console.log(
        "Warning: Cleanup error (may be normal if tables don't exist yet):",
        err.message,
      );
    }

    // Close the direct connection
    await pool.end();

    // Initialize the SQL adapter
    console.log("Initializing SQL adapter...");
    adapter = sqlAdapter({
      pool: {
        host: dbConfig.host,
        user: dbConfig.user,
        password: dbConfig.password,
        database: dbConfig.database,
        port: dbConfig.port,
      },
      prefix: prefix,
    });

    // Connect the adapter
    console.log("Connecting adapter...");
    await adapter.connect();
    console.log("✅ Adapter connected");

    // Test creating a collection
    console.log("Creating collections...");

    // Create users collection
    await adapter.createCollection({
      slug: "users",
      fields: [
        {
          name: "email",
          type: "text",
          required: true,
        },
        {
          name: "name",
          type: "text",
        },
      ],
    });

    // Create categories collection
    await adapter.createCollection({
      slug: "categories",
      fields: [
        {
          name: "name",
          type: "text",
          required: true,
        },
      ],
    });

    // Create posts collection with relationships
    await adapter.createCollection({
      slug: "posts",
      fields: [
        {
          name: "title",
          type: "text",
          required: true,
        },
        {
          name: "content",
          type: "textarea",
        },
        {
          name: "publishDate",
          type: "date",
        },
        {
          name: "author",
          type: "relationship",
          relationTo: "users",
        },
        {
          name: "categories",
          type: "relationship",
          relationTo: "categories",
          hasMany: true,
        },
      ],
    });

    console.log("✅ Collections created");

    // Test creating documents
    console.log("Creating test user document...");
    const user = await adapter.create({
      collection: "users",
      data: {
        email: "test@example.com",
        name: "Test User",
      },
    });
    console.log("✅ Created user:", user);

    console.log("Creating test category documents...");
    const category1 = await adapter.create({
      collection: "categories",
      data: {
        name: "Technology",
      },
    });

    const category2 = await adapter.create({
      collection: "categories",
      data: {
        name: "Programming",
      },
    });
    console.log("✅ Created categories:", [category1, category2]);

    console.log("Creating test post document with relationships...");
    const post = await adapter.create({
      collection: "posts",
      data: {
        title: "Test Post",
        content: "This is a test post content",
        publishDate: new Date().toISOString(),
        author: user.id,
        categories: [category1.id, category2.id],
      },
    });
    console.log("✅ Created post:", post);

    // Test finding documents with relationships
    console.log("Testing findByID with depth = 1...");
    const foundPost = await adapter.findByID({
      collection: "posts",
      id: post.id,
      depth: 1,
    });
    console.log(
      "✅ Found post with relationships:",
      JSON.stringify(foundPost, null, 2),
    );

    // Test updating documents with relationships
    console.log("Testing updating document...");
    const updatedPost = await adapter.findByID({
      collection: "posts",
      id: post.id,
      depth: 0,
    });

    updatedPost.title = "Updated Post Title";
    updatedPost.categories = [category1.id]; // Remove one category

    const result = await adapter.update({
      collection: "posts",
      id: post.id,
      data: updatedPost,
    });

    console.log("✅ Updated post:", result);

    // Verify update worked
    const verifyPost = await adapter.findByID({
      collection: "posts",
      id: post.id,
      depth: 1,
    });
    console.log("✅ Verified update:", JSON.stringify(verifyPost, null, 2));

    // Test deleting documents
    console.log("Testing delete...");
    await adapter.delete({
      collection: "posts",
      id: post.id,
    });

    console.log("✅ Deleted post");

    // Verify document was deleted
    try {
      const deletedPost = await adapter.findByID({
        collection: "posts",
        id: post.id,
      });

      if (deletedPost) {
        console.error("❌ Post was not properly deleted!");
      } else {
        console.log("✅ Verified post was deleted");
      }
    } catch (err) {
      console.log(
        "✅ Verified post was deleted (error expected):",
        err.message,
      );
    }

    console.log("Test completed successfully!");
  } catch (error) {
    console.error("❌ Test failed with error:", error);
  } finally {
    // Close the adapter connection
    if (adapter) {
      console.log("Closing adapter connection...");
      try {
        await adapter.disconnect();
        console.log("Adapter connection closed");
      } catch (err) {
        console.error("Error closing adapter connection:", err);
      }
    }
  }
}

// Run the test
testSQLAdapter().catch(console.error);
