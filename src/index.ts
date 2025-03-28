import type { Field, MySQLAdapter, TypeWithID } from "./types";
import { mysqlAdapter } from "./adapter";

export * from "./drizzle-proxy";

export * from "./schema";

export * from "./relationships";

export default mysqlAdapter;

export { mysqlAdapter };

export type { MySQLAdapter, Field, TypeWithID };
