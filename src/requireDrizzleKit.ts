import { createRequire } from "module";
import type { RequireDrizzleKit } from "@payloadcms/drizzle/types";

const require = createRequire(import.meta.url);

export const requireDrizzleKit: RequireDrizzleKit = () => {
  try {
    const {
      generateMySQLDrizzleJson,
      generateMySQLMigration,
      pushMySQLSchema,
    } = require("drizzle-kit/api");

    return {
      generateDrizzleJson: (args: Record<string, unknown>) =>
        generateMySQLDrizzleJson(args),
      generateMigration: (args: Record<string, unknown>) =>
        generateMySQLMigration(args),
      pushSchema: (args: Record<string, unknown>) => pushMySQLSchema(args),
    };
  } catch (error) {
    throw new Error(
      "drizzle-kit is required for migrations. Please install it with: npm install drizzle-kit --save-dev",
    );
  }
};
