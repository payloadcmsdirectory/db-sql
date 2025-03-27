import type {
  Collection,
  CollectionConfig,
  CreateArgs,
  DeleteOneArgs,
  Field,
  FindArgs,
  FindOneArgs,
  MySQLAdapter,
  PaginatedDocs,
  SQLAdapterOptions,
  TypeWithID,
  UpdateOneArgs,
  Where,
} from "./types";

import { sqlAdapter } from "./adapter";

export * from "./drizzle-proxy";

export * from "./schema";

export * from "./relationships";

export default sqlAdapter;

export { sqlAdapter };

export type {
  SQLAdapterOptions,
  MySQLAdapter,
  Collection,
  Field,
  CreateArgs,
  UpdateOneArgs,
  DeleteOneArgs,
  FindArgs,
  FindOneArgs,
  PaginatedDocs,
  TypeWithID,
  Where,
  CollectionConfig,
};
