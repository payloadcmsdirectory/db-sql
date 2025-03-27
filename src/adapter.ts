import type {
  CollectionConfig,
  CreateArgs,
  DatabaseAdapter,
  DeleteOneArgs,
  Field,
  Find,
  FindArgs,
  FindOneArgs,
  Init,
  migrate,
  PaginatedDocs,
  Payload,
  TypeWithID,
  UpdateOneArgs,
  Where,
  WhereField,
} from "payload";
import mysql from "mysql2/promise";

import type {
  RawColumn,
  RawTable,
  SQLAdapter,
  SQLAdapterOptions,
} from "./types";
import { connect } from "./connect";
import { and, eq, sql } from "./drizzle-proxy";
import { drizzle } from "./drizzle-proxy/mysql";
import { buildDrizzleTable, setColumnID } from "./schema";

/**
 * Format SQL results to match Payload document format
 */
function formatSQLResults<T extends TypeWithID>(
  rows: Record<string, any>[],
  collection: string,
): T[] {
  // Simple pass-through for now
  // This will need to be expanded to handle relationships and complex fields
  return rows.map((row) => ({
    ...row,
    id: row.id || row.ID,
  })) as T[];
}

/**
 * Extract ID from where clause
 */
function extractIdFromWhere(where: Where | undefined): string | number | null {
  if (!where?.id) return null;

  if (typeof where.id === "object") {
    // Handle cases like { id: { equals: '123' } }
    const whereField = where.id as WhereField;
    if (whereField && "equals" in whereField) {
      return whereField.equals as string | number;
    }
  }

  return where.id as string | number;
}

// Helper function to process fields recursively
function processFields(fields: Field[], columns: Record<string, RawColumn>) {
  fields.forEach((field) => {
    // Handle field types that may not have a name property
    const fieldName = "name" in field ? field.name : undefined;
    if (
      !fieldName ||
      fieldName === "id" ||
      fieldName === "createdAt" ||
      fieldName === "updatedAt"
    ) {
      return; // Skip built-in fields or fields without names
    }

    // Skip field types that shouldn't be columns
    if (
      ["array", "blocks", "group", "row", "collapsible", "tabs"].includes(
        field.type,
      )
    ) {
      // For fields with nested fields, process them recursively
      if ("fields" in field && Array.isArray(field.fields)) {
        processFields(field.fields, columns);
      }
      return;
    }

    // Map payload field type to SQL column type
    let type = "varchar";
    switch (field.type) {
      case "text":
      case "email":
        type = "varchar";
        break;
      case "number":
        type = "number";
        break;
      case "checkbox":
        type = "boolean";
        break;
      case "date":
        type = "timestamp";
        break;
      case "richText":
      case "textarea":
      case "code":
        type = "text";
        break;
      case "select":
      case "radio":
        type = "enum";
        break;
      case "json":
        type = "json";
        break;
    }

    // Create column definition
    const column: RawColumn = {
      name: fieldName,
      type,
      notNull: "required" in field ? !!field.required : false,
    };

    // Add enum options if needed
    if (type === "enum" && "options" in field && Array.isArray(field.options)) {
      column.options = field.options.map((opt) =>
        typeof opt === "string" ? opt : opt.value,
      );
    }

    columns[fieldName] = column;
  });
}

/**
 * Create a generic SQL adapter for PayloadCMS
 */
export const sqlAdapter = (options: SQLAdapterOptions): DatabaseAdapter => {
  // Set defaults
  const config = {
    tablePrefix: options.tablePrefix || "",
    port: options.port || 3306,
    debug: options.debug || false,
    dropDatabase: options.dropDatabase || false,
  };

  // Initialize MySQL pool
  const pool = mysql.createPool({
    host: options.host,
    user: options.user,
    password: options.password,
    database: options.database,
    port: config.port,
  });

  // Create Drizzle instance
  const db = drizzle(pool);

  // This will hold our dynamically created tables
  const tables: Record<string, any> = {};

  // Track if we've initialized the adapter
  let isInitialized = false;

  // Create and return the adapter
  const adapter: SQLAdapter = {
    payload: null as any, // Will be initialized later
    pool,
    tablePrefix: config.tablePrefix,
    debug: config.debug,

    // Core connect method
    async connect() {
      try {
        // Test connection
        const connection = await pool.getConnection();
        connection.release();
        return;
      } catch (error) {
        console.error("Error connecting to MySQL database:", error);
        throw error;
      }
    },

    // Initialize database with Payload collections
    init: (async (payload: Payload) => {
      if (isInitialized) return;

      try {
        // Store payload reference
        adapter.payload = payload;

        // Access collections from payload
        const collections = payload.config.collections || [];

        // Drop database if specified (development only)
        if (config.dropDatabase) {
          payload.logger.info(
            `Dropping all tables with prefix: ${config.tablePrefix}`,
          );
          const [existingTables] = await pool.query(
            `
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = ? 
              AND table_name LIKE ?
          `,
            [options.database, `${config.tablePrefix}%`],
          );

          // Drop each table
          for (const tableRow of existingTables as any[]) {
            const tableName = tableRow.table_name || tableRow.TABLE_NAME;
            await pool.query(`DROP TABLE IF EXISTS \`${tableName}\``);
          }
        }

        // Build tables for each collection
        for (const collection of collections) {
          // Generate table schema based on collection fields
          const tableConfig: RawTable = {
            name: `${config.tablePrefix}${collection.slug}`,
            columns: {},
          };

          // Add standard columns
          tableConfig.columns.id = {
            name: "id",
            type: "number",
            primaryKey: true,
            autoIncrement: true,
          };

          tableConfig.columns.createdAt = {
            name: "createdAt",
            type: "timestamp",
            defaultNow: true,
            notNull: true,
          };

          tableConfig.columns.updatedAt = {
            name: "updatedAt",
            type: "timestamp",
            defaultNow: true,
            notNull: true,
          };

          // Convert collection fields to columns
          if (collection.fields) {
            processFields(collection.fields, tableConfig.columns);
          }

          // Build the table using our schema utilities
          const table = buildDrizzleTable({
            adapter,
            tableName: tableConfig.name,
            tableConfig,
          });

          tables[collection.slug] = table;

          // Create the table in the database
          try {
            // We'll use raw SQL to create the table for full control
            const createTableSQL = `
              CREATE TABLE IF NOT EXISTS \`${tableConfig.name}\` (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
              )
            `;

            await pool.query(createTableSQL);

            // Get existing columns to compare with needed columns
            const [existingColumns] = await pool.query(
              `
              SELECT column_name 
              FROM information_schema.columns 
              WHERE table_schema = ? AND table_name = ?
            `,
              [options.database, tableConfig.name],
            );

            const existingColumnNames = (existingColumns as any[])
              .map((col) => col.column_name || col.COLUMN_NAME)
              .map((name) => name.toLowerCase());

            // Add missing columns
            for (const [key, column] of Object.entries(tableConfig.columns)) {
              // Skip id, it's already created
              if (key === "id" || key === "createdAt" || key === "updatedAt")
                continue;

              if (!existingColumnNames.includes(column.name.toLowerCase())) {
                let columnSQL = "";

                // Map column type to SQL
                switch (column.type) {
                  case "varchar":
                    columnSQL = `VARCHAR(${column.length || 255})`;
                    break;
                  case "text":
                    columnSQL = "TEXT";
                    break;
                  case "number":
                    columnSQL = "INT";
                    break;
                  case "boolean":
                    columnSQL = "BOOLEAN";
                    break;
                  case "timestamp":
                    columnSQL = "DATETIME";
                    break;
                  case "json":
                    columnSQL = "JSON";
                    break;
                  case "enum":
                    if (column.options && column.options.length) {
                      columnSQL = `ENUM(${column.options.map((opt) => `'${opt}'`).join(",")})`;
                    } else {
                      columnSQL = "VARCHAR(255)";
                    }
                    break;
                  default:
                    columnSQL = "VARCHAR(255)";
                }

                // Add constraints
                if (column.notNull) {
                  columnSQL += " NOT NULL";
                }

                if (column.default !== undefined) {
                  if (column.default === null) {
                    columnSQL += " DEFAULT NULL";
                  } else if (typeof column.default === "string") {
                    columnSQL += ` DEFAULT '${column.default}'`;
                  } else {
                    columnSQL += ` DEFAULT ${column.default}`;
                  }
                }

                const alterSQL = `ALTER TABLE \`${tableConfig.name}\` ADD COLUMN \`${column.name}\` ${columnSQL}`;
                await pool.query(alterSQL);

                payload.logger.info(
                  `Added column ${column.name} to table ${tableConfig.name}`,
                );
              }
            }

            payload.logger.info(`Initialized table: ${tableConfig.name}`);
          } catch (error) {
            payload.logger.error(
              `Error creating table ${tableConfig.name}:`,
              error,
            );
          }
        }

        isInitialized = true;
        payload.logger.info("SQL Adapter initialized successfully");

        // Store the tables for later use
        adapter.tables = tables;
      } catch (error) {
        console.error("Error initializing SQL adapter:", error);
        throw error;
      }
    }) as Init,

    // Store tables for reference
    tables,

    // All DB operation methods follow

    // Find documents
    find: (async <T extends TypeWithID = any>(
      args: FindArgs,
    ): Promise<PaginatedDocs<T>> => {
      const { collection, where, page = 1, limit = 10, sort } = args;
      const tableName = `${config.tablePrefix}${collection}`;
      const offset = (page - 1) * limit;

      try {
        // Count total documents
        const [countResult] = await pool.query(
          `SELECT COUNT(*) as count FROM \`${tableName}\``,
        );

        const totalDocs = Number((countResult as any[])[0]?.count || 0);

        // Get documents with pagination
        const [rows] = await pool.query(
          `SELECT * FROM \`${tableName}\` LIMIT ? OFFSET ?`,
          [limit, offset],
        );

        // Format results
        const docs = formatSQLResults<T>(rows as any[], collection);

        return {
          docs,
          totalDocs,
          limit,
          totalPages: Math.ceil(totalDocs / limit),
          page,
          pagingCounter: (page - 1) * limit + 1,
          hasPrevPage: page > 1,
          hasNextPage: page * limit < totalDocs,
          prevPage: page > 1 ? page - 1 : null,
          nextPage: page * limit < totalDocs ? page + 1 : null,
        };
      } catch (error) {
        console.error(`Error in find for ${collection}:`, error);
        return {
          docs: [] as T[],
          totalDocs: 0,
          limit,
          totalPages: 0,
          page,
          pagingCounter: 1,
          hasPrevPage: false,
          hasNextPage: false,
          prevPage: null,
          nextPage: null,
        };
      }
    }) as Find,

    // Find a single document
    async findOne<T extends TypeWithID = any>(
      args: FindOneArgs,
    ): Promise<T | null> {
      const { collection, where } = args;
      const tableName = `${config.tablePrefix}${collection}`;

      try {
        // Extract ID from where clause
        const idValue = extractIdFromWhere(where);

        if (idValue) {
          // Find by ID
          const [rows] = await pool.query(
            `SELECT * FROM \`${tableName}\` WHERE id = ? LIMIT 1`,
            [idValue],
          );

          if (!(rows as any[]).length) return null;

          // Format result
          const docs = formatSQLResults<T>(rows as any[], collection);
          return docs[0] || null;
        } else {
          // Basic where implementation - this would need to be expanded for complex where clauses
          const [rows] = await pool.query(
            `SELECT * FROM \`${tableName}\` LIMIT 1`,
          );

          if (!(rows as any[]).length) return null;

          // Format result
          const docs = formatSQLResults<T>(rows as any[], collection);
          return docs[0] || null;
        }
      } catch (error) {
        console.error(`Error in findOne for ${collection}:`, error);
        return null;
      }
    },

    // Create document
    async create<T extends TypeWithID = any>(args: CreateArgs): Promise<T> {
      const { collection, data } = args;
      const tableName = `${config.tablePrefix}${collection}`;

      try {
        // Remove any properties that aren't columns
        const { id, ...insertData } = data;

        if (Object.keys(insertData).length === 0) {
          // If no data to insert, just create a record with timestamps
          const [result] = await pool.query(
            `INSERT INTO \`${tableName}\` (createdAt, updatedAt) VALUES (NOW(), NOW())`,
          );

          const insertId = (result as any).insertId;

          // Fetch the created document
          const doc = await adapter.findOne({
            collection,
            where: { id: { equals: insertId } },
          });

          return doc as T;
        }

        // Build dynamic insert query
        const columns = Object.keys(insertData).join(", ");
        const placeholders = Object.keys(insertData)
          .map(() => "?")
          .join(", ");

        const [result] = await pool.query(
          `INSERT INTO \`${tableName}\` (${columns}, createdAt, updatedAt) 
           VALUES (${placeholders}, NOW(), NOW())`,
          Object.values(insertData).map((value) =>
            typeof value === "object" ? JSON.stringify(value) : value,
          ),
        );

        const insertId = (result as any).insertId;

        // Fetch the created document
        const doc = await adapter.findOne({
          collection,
          where: { id: { equals: insertId } },
        });

        return doc as T;
      } catch (error) {
        console.error(`Error in create for ${collection}:`, error);
        throw error;
      }
    },

    // Update document
    updateOne: (async <T extends TypeWithID = any>(
      args: UpdateOneArgs,
    ): Promise<T> => {
      const { collection, id, data } = args;
      const tableName = `${config.tablePrefix}${collection}`;

      try {
        // Skip if no data to update
        if (Object.keys(data).length === 0) {
          return adapter.findOne({
            collection,
            where: { id: { equals: id } },
          }) as Promise<T>;
        }

        // Build SET clause
        const setClause = Object.keys(data)
          .map((key) => `${key} = ?`)
          .join(", ");

        // Always update the updatedAt timestamp
        await pool.query(
          `UPDATE \`${tableName}\` SET ${setClause}, updatedAt = NOW() WHERE id = ?`,
          [
            ...Object.values(data).map((value) =>
              typeof value === "object" ? JSON.stringify(value) : value,
            ),
            id,
          ],
        );

        // Fetch the updated document
        const doc = await adapter.findOne({
          collection,
          where: { id: { equals: id } },
        });

        return doc as T;
      } catch (error) {
        console.error(`Error in updateOne for ${collection}:`, error);
        throw error;
      }
    }) as any,

    // Delete document
    deleteOne: (async <T extends TypeWithID = any>(
      args: DeleteOneArgs,
    ): Promise<T> => {
      const { collection, where } = args;
      const tableName = `${config.tablePrefix}${collection}`;

      try {
        // Extract ID from where clause
        const id = extractIdFromWhere(where);

        if (!id) {
          throw new Error("ID is required for delete operation");
        }

        // Get the document before deletion
        const doc = await adapter.findOne({
          collection,
          where: { id: { equals: id } },
        });

        if (!doc) {
          throw new Error(`Document with ID ${id} not found`);
        }

        // Delete the document
        await pool.query(`DELETE FROM \`${tableName}\` WHERE id = ?`, [id]);

        return doc as T;
      } catch (error) {
        console.error(`Error in deleteOne for ${collection}:`, error);
        throw error;
      }
    }) as any,

    // Additional required methods
    migrate: (async () => {
      // Migration is handled in init
    }) as any,

    // Transaction support
    beginTransaction: async () => {
      const connection = await pool.getConnection();
      await connection.beginTransaction();
      return connection as unknown as string;
    },

    commitTransaction: async (transaction: any) => {
      await transaction.commit();
      transaction.release();
    },

    rollbackTransaction: async (transaction: any) => {
      await transaction.rollback();
      transaction.release();
    },

    // Required placeholder methods for DatabaseAdapter
    afterRead: () => Promise.resolve(),
    beforeRead: () => Promise.resolve(),
    buildQuery: () => ({ where: {} }),

    // Required implementations with minimal functionality
    createGlobal: async () => ({}) as any,
    createGlobalVersion: async () => ({}) as any,
    createVersion: async () => ({}) as any,
    deleteMany: async () => ({}) as any,
    destroySession: async () => ({}) as any,
    findGlobal: async () => ({}) as any, // Return empty object instead of null
    findGlobalVersions: async () => ({
      docs: [],
      totalDocs: 0,
      limit: 10,
      totalPages: 1,
      page: 1,
      pagingCounter: 1,
      hasPrevPage: false,
      hasNextPage: false,
      prevPage: null,
      nextPage: null,
    }),
    findGlobalVersionByID: async () => null,
    findVersions: async () => ({
      docs: [],
      totalDocs: 0,
      limit: 10,
      totalPages: 1,
      page: 1,
      pagingCounter: 1,
      hasPrevPage: false,
      hasNextPage: false,
      prevPage: null,
      nextPage: null,
    }),
    findVersionByID: async () => null,
    queryDrafts: async () => ({
      docs: [],
      totalDocs: 0,
      limit: 10,
      totalPages: 1,
      page: 1,
      pagingCounter: 1,
      hasPrevPage: false,
      hasNextPage: false,
      prevPage: null,
      nextPage: null,
    }),
    readSession: async () => null,
    updateGlobal: async () => ({}) as any,
    updateGlobalVersion: async () => ({}) as any,
    updateVersion: async () => ({}) as any,
  };

  return adapter;
};
