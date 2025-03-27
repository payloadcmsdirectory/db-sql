import {
  binary,
  boolean,
  datetime,
  int,
  json,
  mysqlEnum,
  serial,
  text,
  timestamp,
  tinyint,
  varchar,
} from "drizzle-orm/mysql-core";

import type { AnyMySqlColumn } from "drizzle-orm/mysql-core";

// This function converts database column types to Drizzle ORM code
export function columnToCodeConverter(
  name: string,
  type: string,
  meta: any = {},
): any {
  let column: any;

  switch (type.toLowerCase()) {
    case "binary":
    case "blob":
      column = binary(name, { length: meta.length });
      break;

    case "boolean":
      column = boolean(name);
      break;

    case "date":
    case "datetime":
      column = datetime(name, meta);
      break;

    case "timestamp":
      column = timestamp(name, meta);
      break;

    case "integer":
    case "int":
    case "number":
    case "bigint":
      if (meta.primaryKey && meta.autoincrement) {
        column = serial(name).primaryKey();
      } else {
        column = int(name, meta);
      }
      break;

    case "tinyint":
      column = tinyint(name, meta);
      break;

    case "enum":
      if (meta.options && Array.isArray(meta.options)) {
        column = mysqlEnum(name, meta.options);
      } else {
        column = varchar(name, { length: 255 });
      }
      break;

    case "json":
      column = json(name);
      break;

    case "text":
      column = text(name);
      break;

    case "varchar":
    default:
      column = varchar(name, { length: meta.length || 255 });
      break;
  }

  // Apply common column constraints
  if (meta.primaryKey) {
    column = column.primaryKey();
  }

  if (meta.notNull) {
    column = column.notNull();
  }

  if (meta.unique) {
    column = column.unique();
  }

  if (meta.default !== undefined) {
    column = column.default(meta.default);
  }

  return column;
}
