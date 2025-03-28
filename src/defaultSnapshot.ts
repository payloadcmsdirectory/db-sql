import type { DrizzleMySQLSnapshotJSON } from "drizzle-kit/api";

export const defaultDrizzleSnapshot = {
  id: "00000000-0000-0000-0000-000000000000",
  dialect: "mysql",
  version: "5",
  tables: {},
  _meta: {
    tables: {},
    columns: {},
  },
  schemas: {},
  views: {},
};
