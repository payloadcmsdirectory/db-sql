import type { MySQLAdapter } from "./types.js";

export async function requireDrizzleKit(this: MySQLAdapter): Promise<any> {
  try {
    return await import("drizzle-kit");
  } catch (error) {
    this.payload.logger.error(
      "drizzle-kit is required for migrations. Please install it with: npm install drizzle-kit --save-dev",
    );
    throw new Error("drizzle-kit is required for migrations");
  }
}
