import type { BuildDrizzleTable, RawColumn } from "@payloadcms/drizzle/types";
import type {
  ForeignKey,
  Index,
  MySqlColumnBuilderBase,
  MySqlTableWithColumns,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import {
  decimal,
  foreignKey,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  tinyint,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";
import { v4 as uuidv4 } from "uuid";

const rawColumnBuilderMap: Partial<Record<RawColumn["type"], any>> = {
  integer: int,
  numeric: decimal,
  text,
};

export const buildDrizzleTable: BuildDrizzleTable = ({
  adapter,
  locales,
  rawTable,
}) => {
  const columns: Record<string, any> = {};

  for (const [key, column] of Object.entries(rawTable.columns)) {
    switch (column.type) {
      case "boolean": {
        // MySQL typically uses TINYINT(1) for boolean values
        columns[key] = tinyint(column.name);
        break;
      }

      case "enum":
        if ("locale" in column) {
          if (locales && locales.length) {
            columns[key] = mysqlEnum(
              column.name,
              locales as [string, ...string[]],
            );
          } else {
            columns[key] = varchar(column.name, { length: 50 });
          }
        } else {
          if (column.options && column.options.length) {
            columns[key] = mysqlEnum(
              column.name,
              column.options as [string, ...string[]],
            );
          } else {
            columns[key] = varchar(column.name, { length: 50 });
          }
        }
        break;

      case "geometry": {
        // For MySQL 5.7+ we could use spatial types, but for compatibility we use JSON
        columns[key] = json(column.name);
        break;
      }

      case "jsonb": {
        columns[key] = json(column.name);
        break;
      }

      case "serial": {
        columns[key] = int(column.name).autoincrement();
        break;
      }

      case "timestamp": {
        let builder = timestamp(column.name);

        if (column.defaultNow) {
          builder = builder.default(sql`NOW()`);
        }

        columns[key] = builder;
        break;
      }

      case "uuid": {
        let builder = varchar(column.name, { length: 36 });

        if (column.defaultRandom) {
          builder = builder.$defaultFn(() => uuidv4());
        }

        columns[key] = builder;
        break;
      }

      case "varchar": {
        columns[key] = varchar(column.name, { length: 255 });
        break;
      }

      default:
        if (rawColumnBuilderMap[column.type]) {
          columns[key] = rawColumnBuilderMap[column.type](column.name);
        } else {
          // Fallback to varchar if type is not recognized
          columns[key] = varchar(column.name, { length: 255 });
        }
        break;
    }

    if (column.reference) {
      const ref = column.reference;
      columns[key].references(() => adapter.tables[ref.table][ref.name], {
        onDelete: ref.onDelete,
      });
    }

    if (column.primaryKey) {
      if (column.type === "integer" && column.autoIncrement) {
        // For MySQL, autoincrement is set directly on the column
        columns[key] = int(column.name).autoincrement().primaryKey();
      } else {
        columns[key].primaryKey();
      }
    }

    if (column.notNull) {
      columns[key].notNull();
    }

    if (typeof column.default !== "undefined") {
      let sanitizedDefault = column.default;

      if (column.type === "geometry" && Array.isArray(column.default)) {
        sanitizedDefault = JSON.stringify({
          type: "Point",
          coordinates: [column.default[0], column.default[1]],
        });
      }

      columns[key].default(sanitizedDefault);
    }
  }

  const extraConfig = (cols: any) => {
    const config: Record<string, any> = {};

    if (rawTable.indexes) {
      for (const [key, rawIndex] of Object.entries(rawTable.indexes)) {
        let fn: any = index;
        if (rawIndex.unique) {
          fn = uniqueIndex;
        }

        if (Array.isArray(rawIndex.on)) {
          if (rawIndex.on.length) {
            config[key] = fn(rawIndex.name).on(
              ...rawIndex.on.map((colName) => cols[colName]),
            );
          }
        } else {
          config[key] = fn(rawIndex.name).on(cols[rawIndex.on]);
        }
      }
    }

    if (rawTable.foreignKeys) {
      for (const [key, rawForeignKey] of Object.entries(rawTable.foreignKeys)) {
        let builder = foreignKey({
          name: rawForeignKey.name,
          columns: rawForeignKey.columns.map((colName) => cols[colName]) as any,
          foreignColumns: rawForeignKey.foreignColumns.map(
            (column) => adapter.tables[column.table][column.name],
          ),
        });

        if (rawForeignKey.onDelete) {
          builder = builder.onDelete(rawForeignKey.onDelete);
        }

        if (rawForeignKey.onUpdate) {
          builder = builder.onUpdate(rawForeignKey.onUpdate);
        }

        config[key] = builder;
      }
    }

    return config;
  };

  adapter.tables[rawTable.name] = mysqlTable(
    rawTable.name,
    columns as any,
    extraConfig as any,
  ) as MySqlTableWithColumns<any>;
};
