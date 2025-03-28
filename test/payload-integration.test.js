import { jest } from "@jest/globals";
import { sql } from "drizzle-orm";
import payload from "payload";

import { mysqlAdapter } from "../dist/src/adapter.js";

jest.setTimeout(30000); // Increase timeout for Payload initialization

describe("MySQL Adapter with Payload API Integration", () => {
  let userId;
  let categoryId;
  let postId;

  beforeAll(async () => {
    // Initialize Payload with MySQL adapter
    try {
      await payload.init({
        secret: "test-mysql-adapter-secret",
        local: true, // Important: run in local mode without Express
        db: {
          adapter: mysqlAdapter({
            pool: {
              host: "localhost",
              user: "root",
              password: "rootpassword",
              database: "payload_test",
              port: 3306,
            },
            prefix: "pl_",
          }),
        },
        collections: [
          {
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
          {
            slug: "categories",
            fields: [
              {
                name: "name",
                type: "text",
                required: true,
              },
            ],
          },
          {
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
        ],
      });

      console.log("Payload initialized successfully");
    } catch (error) {
      console.error("Error initializing Payload:", error);
      throw error;
    }
  });

  afterAll(async () => {
    // Clean up and disconnect
    try {
      if (payload.db) {
        const adapter = payload.db.adapter;

        // Try to clean up the tables
        if (adapter.drizzle) {
          try {
            await adapter.drizzle.execute(
              sql`DROP TABLE IF EXISTS pl_posts_categories_rels`,
            );
            await adapter.drizzle.execute(sql`DROP TABLE IF EXISTS pl_posts`);
            await adapter.drizzle.execute(
              sql`DROP TABLE IF EXISTS pl_categories`,
            );
            await adapter.drizzle.execute(sql`DROP TABLE IF EXISTS pl_users`);
          } catch (error) {
            console.warn("Cleanup error:", error.message);
          }
        }

        // Destroy the DB connection
        await payload.db.destroy();
      }
    } catch (error) {
      console.error("Error during cleanup:", error);
    }
  });

  test("should create a user", async () => {
    try {
      const user = await payload.create({
        collection: "users",
        data: {
          email: "test@example.com",
          name: "Test User",
        },
      });

      userId = user.id;

      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.email).toBe("test@example.com");
      expect(user.name).toBe("Test User");
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  });

  test("should create a category", async () => {
    try {
      const category = await payload.create({
        collection: "categories",
        data: {
          name: "Test Category",
        },
      });

      categoryId = category.id;

      expect(category).toBeDefined();
      expect(category.id).toBeDefined();
      expect(category.name).toBe("Test Category");
    } catch (error) {
      console.error("Error creating category:", error);
      throw error;
    }
  });

  test("should create a post with relationships", async () => {
    try {
      const post = await payload.create({
        collection: "posts",
        data: {
          title: "Test Post",
          content: "This is a test post content",
          publishDate: new Date().toISOString(),
          author: userId,
          categories: [categoryId],
        },
      });

      postId = post.id;

      expect(post).toBeDefined();
      expect(post.id).toBeDefined();
      expect(post.title).toBe("Test Post");
      expect(post.content).toBe("This is a test post content");
      expect(post.author).toBe(userId);
      expect(Array.isArray(post.categories)).toBe(true);
      expect(post.categories).toContain(categoryId);
    } catch (error) {
      console.error("Error creating post:", error);
      throw error;
    }
  });

  test("should find a post by ID with populated relationships", async () => {
    try {
      const post = await payload.findByID({
        collection: "posts",
        id: postId,
        depth: 1, // Populate relationships one level deep
      });

      expect(post).toBeDefined();
      expect(post.id).toBe(postId);
      expect(post.title).toBe("Test Post");

      // Author relationship should be populated
      expect(typeof post.author).toBe("object");
      expect(post.author.id).toBe(userId);
      expect(post.author.email).toBe("test@example.com");

      // Categories relationship should be populated
      expect(Array.isArray(post.categories)).toBe(true);
      expect(post.categories.length).toBe(1);
      expect(post.categories[0].id).toBe(categoryId);
      expect(post.categories[0].name).toBe("Test Category");
    } catch (error) {
      console.error("Error finding post:", error);
      throw error;
    }
  });

  test("should update a post", async () => {
    try {
      const updatedPost = await payload.update({
        collection: "posts",
        id: postId,
        data: {
          title: "Updated Test Post",
        },
      });

      expect(updatedPost).toBeDefined();
      expect(updatedPost.id).toBe(postId);
      expect(updatedPost.title).toBe("Updated Test Post");

      // Verify relationships are preserved
      expect(updatedPost.author).toBe(userId);
      expect(Array.isArray(updatedPost.categories)).toBe(true);
      expect(updatedPost.categories).toContain(categoryId);
    } catch (error) {
      console.error("Error updating post:", error);
      throw error;
    }
  });

  test("should find posts with a filter", async () => {
    try {
      const { docs } = await payload.find({
        collection: "posts",
        where: {
          title: {
            equals: "Updated Test Post",
          },
        },
      });

      expect(docs).toBeDefined();
      expect(Array.isArray(docs)).toBe(true);
      expect(docs.length).toBeGreaterThan(0);
      expect(docs[0].id).toBe(postId);
      expect(docs[0].title).toBe("Updated Test Post");
    } catch (error) {
      console.error("Error finding posts:", error);
      throw error;
    }
  });

  test("should delete a post", async () => {
    try {
      // First create a temporary post to delete
      const tempCategory = await payload.create({
        collection: "categories",
        data: {
          name: "Temp Category",
        },
      });

      const tempPost = await payload.create({
        collection: "posts",
        data: {
          title: "Temp Post",
          content: "This will be deleted",
          author: userId,
          categories: [tempCategory.id],
        },
      });

      // Delete the post
      const deletedPost = await payload.delete({
        collection: "posts",
        id: tempPost.id,
      });

      expect(deletedPost).toBeDefined();
      expect(deletedPost.id).toBe(tempPost.id);

      // Verify it was deleted by trying to find it
      try {
        await payload.findByID({
          collection: "posts",
          id: tempPost.id,
        });

        // If we get here, the test should fail
        expect(true).toBe(false);
      } catch (error) {
        // Should get a "not found" error
        expect(error.message).toContain("not found");
      }

      // Clean up the category
      await payload.delete({
        collection: "categories",
        id: tempCategory.id,
      });
    } catch (error) {
      console.error("Error in delete test:", error);
      throw error;
    }
  });
});
