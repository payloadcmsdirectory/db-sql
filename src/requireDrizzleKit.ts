import type { MySQLAdapter } from "./types";

/**
 * Import drizzle-kit for MySQL migrations
 *
 * Note: Unlike the PayloadCMS implementation which uses createRequire and extracts
 * specific functions from drizzle-kit/api, this implementation uses ESM dynamic import
 * to load the entire drizzle-kit package. This approach is more compatible with various
 * module systems while still providing the necessary functionality.
 *
 * If specific MySQL functions need to be extracted in the future, they can be accessed
 * from the returned drizzle-kit object.
 *
 * @returns The drizzle-kit package for use with MySQL migrations
 */
export async function requireDrizzleKit(this: MySQLAdapter): Promise<any> {
  try {
    // Import the drizzle-kit package
    const drizzleKit = await import("drizzle-kit");

    // Return the drizzle-kit module for MySQL operations
    return drizzleKit;
  } catch (error) {
    if (this.payload?.logger) {
      this.payload.logger.error(
        "drizzle-kit is required for migrations. Please install it with: npm install drizzle-kit --save-dev",
      );
    }
    throw new Error("drizzle-kit is required for migrations");
  }
}
