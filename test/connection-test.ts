import { sqlAdapter } from "../src/index";
import { MySQLAdapter, SQLAdapterOptions } from "../src/types";

/**
 * This test validates the basic functionality of the SQL adapter
 *
 * To run this test:
 * 1. Configure your MySQL connection settings below
 * 2. Run using ts-node: npx ts-node test/connection-test.ts
 */

// For testing, create a dummy payload object
// This simulates what PayloadCMS would do
const dummyPayload = {
  collections: {
    posts: {
      config: {
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
      },
    },
    users: {
      config: {
        slug: "users",
        fields: [
          {
            name: "email",
            type: "email",
            required: true,
          },
          {
            name: "name",
            type: "text",
          },
        ],
      },
    },
    categories: {
      config: {
        slug: "categories",
        fields: [
          {
            name: "name",
            type: "text",
            required: true,
          },
        ],
      },
    },
  },
};

async function testConnection() {
  console.log("Starting SQL adapter test...");

  // Create the adapter with your MySQL settings
  const adapterOptions: SQLAdapterOptions = {
    pool: {
      host: "localhost",
      user: "root",
      password: "rootpassword",
      database: "payload_test",
      port: 3306,
    },
    prefix: "pl_",
  };

  const adapter = sqlAdapter(adapterOptions) as MySQLAdapter;

  try {
    // Connect to the database
    console.log("Connecting to database...");
    await adapter.connect();
    console.log("✅ Connected successfully");

    // Initialize collections
    console.log("Creating collections...");
    await adapter.createCollection(dummyPayload.collections.users.config);
    await adapter.createCollection(dummyPayload.collections.categories.config);
    await adapter.createCollection(dummyPayload.collections.posts.config);
    console.log("✅ Collections created");

    // Create a test user
    console.log("Creating test user...");
    const user = await adapter.create({
      collection: "users",
      data: {
        email: "test@example.com",
        name: "Test User",
      },
    });
    console.log("✅ Created user:", user);

    // Create a test category
    console.log("Creating test category...");
    const category = await adapter.create({
      collection: "categories",
      data: {
        name: "Test Category",
      },
    });
    console.log("✅ Created category:", category);

    // Create a test post with relationships
    console.log("Creating test post with relationships...");
    const post = await adapter.create({
      collection: "posts",
      data: {
        title: "Test Post",
        content: "This is a test post content",
        publishDate: new Date().toISOString(),
        author: user.id,
        categories: [category.id],
      },
    });
    console.log("✅ Created post:", post);

    // Query the post with relationships
    console.log("Querying post with depth=1 to load relationships...");
    const result = await adapter.findByID({
      collection: "posts",
      id: post.id,
      depth: 1,
    });
    console.log(
      "✅ Query result with relationships:",
      JSON.stringify(result, null, 2),
    );

    // Clean up
    console.log("Test completed successfully!");
  } catch (error) {
    console.error("❌ Test failed with error:", error);
  } finally {
    // Close the connection
    console.log("Closing connection...");
    await adapter.disconnect();
    console.log("Connection closed");
  }
}

// Run the test
testConnection().catch(console.error);
