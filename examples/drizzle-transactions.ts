/**
 * Example: Using Drizzle Transactions with the MySQL Adapter
 *
 * This example demonstrates how to use Drizzle ORM's transaction API
 * with the PayloadCMS MySQL adapter to ensure data consistency.
 */

import { eq, sql } from "drizzle-orm";

import { sqlAdapter } from "../src";

async function runTransactionExample() {
  // Initialize the adapter
  const adapter = sqlAdapter({
    pool: {
      host: "localhost",
      user: "root",
      password: "password",
      database: "payload",
      port: 3306,
    },
    prefix: "payload_",
  });

  // Connect to the database
  await adapter.connect();

  try {
    console.log("Starting transaction example...");

    // Example: Using Drizzle transaction API directly
    // This is how the adapter uses transactions internally
    await adapter.db.transaction(async (tx) => {
      // Get table references
      const usersTable = adapter.tables["payload_users"];
      const postsTable = adapter.tables["payload_posts"];

      // Create a user
      const userResult = await tx
        .insert(usersTable)
        .values({
          email: "test@example.com",
          name: "Test User",
        })
        .execute();

      const userId = (userResult as any).insertId;

      // Create a post associated with the user
      await tx
        .insert(postsTable)
        .values({
          title: "My First Post",
          content: "This is a post created within a transaction",
          author: userId,
        })
        .execute();

      // If any operation fails, the entire transaction is rolled back automatically
      console.log("Transaction successful - created user and post");
    });

    // Example: Transaction with custom options using raw SQL
    await adapter.db.transaction(
      async (tx) => {
        // Update multiple records atomically using raw SQL
        await tx.execute(
          sql`UPDATE payload_posts SET status = 'published' WHERE status = 'draft'`,
        );

        console.log("All draft posts published in a single transaction");
      },
      {
        isolationLevel: "read committed", // MySQL-specific isolation level
      },
    );
  } catch (error) {
    console.error("Error in transaction example:", error);
  } finally {
    // Disconnect from the database
    await adapter.disconnect();
  }
}

// Run the example
runTransactionExample().catch(console.error);
