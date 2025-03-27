import type { Pool } from "mysql2/promise";
import type { Payload } from "payload";
import { createPool } from "mysql2/promise";

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
import { drizzle } from "./drizzle-proxy/mysql";
import {
  buildRelationshipTable,
  createRelationshipDrizzleTable,
  processDocumentRelationships,
} from "./relationships";
import { buildDrizzleTable, setColumnID } from "./schema";

/**
 * MySQL Database Adapter for PayloadCMS
 *
 * NOTE: This implementation differs from native PayloadCMS adapters:
 *
 * 1. We use a modular approach with separate folders for relationships, schema, and drizzle-proxy
 * 2. Our implementation has more explicit handling of MySQL-specific functionality
 * 3. Junction tables are manually created and managed for relationships
 * 4. We use direct SQL queries in some places for better control over the database
 *
 * These differences allow us to better handle MySQL's specific requirements while
 * maintaining compatibility with the PayloadCMS adapter interface.
 */

/**
 * Helper function to process fields and identify relationship fields
 */
function processFields(fields: Field[] = []): {
  relationshipFields: Field[];
  normalFields: Field[];
} {
  const relationshipFields: Field[] = [];
  const normalFields: Field[] = [];

  fields.forEach((field) => {
    if (field.type === "relationship") {
      relationshipFields.push(field);
    } else {
      normalFields.push(field);
    }
  });

  return { relationshipFields, normalFields };
}

/**
 * Helper to format SQL results into payload format
 */
function formatSQLResult(result: any): any {
  // For empty results
  if (!result) return null;

  // Handle array results (multiple rows)
  if (Array.isArray(result)) {
    return result.map((item) => formatSQLResult(item));
  }

  // Handle single row result
  const formattedResult: Record<string, any> = {};

  // Format each field in the result
  Object.entries(result).forEach(([key, value]) => {
    formattedResult[key] = value;
  });

  return formattedResult;
}

/**
 * MySQL Adapter for Payload CMS
 */
export const sqlAdapter = (options: SQLAdapterOptions): MySQLAdapter => {
  const { pool: poolOptions, prefix = "" } = options;

  // Create MySQL connection pool
  let pool: Pool;
  let db: ReturnType<typeof drizzle> | null = null;

  // Initialize collections registry
  const collections: Record<string, Collection> = {};
  const tables: Record<string, any> = {};
  const tableNameMap = new Map<string, string>();

  // Connect to the database
  const connect = async (): Promise<void> => {
    try {
      pool = createPool({
        host: poolOptions.host,
        user: poolOptions.user,
        password: poolOptions.password,
        database: poolOptions.database,
        port: poolOptions.port || 3306,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      });

      // Initialize Drizzle ORM with the MySQL pool
      db = drizzle(pool);

      console.log("Connected to MySQL database");
    } catch (error) {
      console.error("Failed to connect to MySQL database:", error);
      throw error;
    }
  };

  // Disconnect from the database
  const disconnect = async (): Promise<void> => {
    if (pool) {
      await pool.end();
      console.log("Disconnected from MySQL database");
    }
  };

  // Create a collection schema in the database
  const createCollection = async (
    collectionConfig: CollectionConfig,
  ): Promise<void> => {
    const { slug, fields = [] } = collectionConfig;

    try {
      // Register collection in collections registry
      collections[slug] = collectionConfig;

      // Generate table name with prefix
      const tableName = `${prefix}${slug}`;
      tableNameMap.set(slug, tableName);

      // Process fields to separate relationship fields
      const { relationshipFields, normalFields } = processFields(fields);

      // Build table config for normal fields
      const tableConfig = {
        name: tableName,
        columns: [
          {
            name: "id",
            type: "id",
            primary: true,
          },
          ...normalFields.map((field) => ({
            name: field.name,
            type: field.type === "number" ? "int" : "varchar",
            required: field.required || false,
            unique: field.unique || false,
            defaultValue: field.defaultValue,
            length: field.type === "text" ? 1000 : undefined,
          })),
        ],
      };

      // Build the Drizzle table
      const table = buildDrizzleTable({
        adapter: {
          tables,
          tablePrefix: prefix,
          db,
        } as any,
        tableName,
        tableConfig,
      });

      // Process relationship fields to create junction tables
      relationshipFields.forEach((field) => {
        if (typeof field.relationTo === "string") {
          buildRelationshipTable({
            adapter: {
              tables,
              tablePrefix: prefix,
              client: pool,
              db,
              tableNameMap,
            } as any,
            fromCollection: slug,
            toCollection: field.relationTo,
            relationField: field.name,
          });
        }
      });

      console.log(`Created collection: ${slug}`);
    } catch (error) {
      console.error(`Failed to create collection ${slug}:`, error);
      throw error;
    }
  };

  // Find documents in a collection
  const find = async <T extends TypeWithID = any>({
    collection,
    limit = 10,
    page = 1,
    sort,
    where,
    depth = 0,
    req,
  }: FindArgs): Promise<PaginatedDocs<T>> => {
    try {
      const tableName =
        tableNameMap.get(collection) || `${prefix}${collection}`;

      // Build WHERE clause
      let whereClause = "";
      const whereParams: any[] = [];

      if (where) {
        // Simple implementation of where clauses
        const conditions: string[] = [];

        Object.entries(where).forEach(([field, condition]) => {
          if (condition && typeof condition === "object") {
            if ("equals" in condition) {
              conditions.push(`${field} = ?`);
              whereParams.push(condition.equals);
            } else if ("not_equals" in condition) {
              conditions.push(`${field} != ?`);
              whereParams.push(condition.not_equals);
            } else if ("greater_than" in condition) {
              conditions.push(`${field} > ?`);
              whereParams.push(condition.greater_than);
            } else if ("less_than" in condition) {
              conditions.push(`${field} < ?`);
              whereParams.push(condition.less_than);
            } else if ("like" in condition) {
              conditions.push(`${field} LIKE ?`);
              whereParams.push(`%${condition.like}%`);
            } else if ("in" in condition && Array.isArray(condition.in)) {
              const placeholders = condition.in.map(() => "?").join(",");
              conditions.push(`${field} IN (${placeholders})`);
              whereParams.push(...condition.in);
            }
          }
        });

        if (conditions.length > 0) {
          whereClause = ` WHERE ${conditions.join(" AND ")}`;
        }
      }

      // Calculate pagination
      const offset = (page - 1) * limit;

      // Build ORDER BY clause
      let orderClause = "";
      if (sort) {
        const sortFields = Array.isArray(sort) ? sort : [sort];
        const orderParts = sortFields.map((field) => {
          const direction = field.startsWith("-") ? "DESC" : "ASC";
          const cleanField = field.startsWith("-") ? field.substring(1) : field;
          return `${cleanField} ${direction}`;
        });

        if (orderParts.length > 0) {
          orderClause = ` ORDER BY ${orderParts.join(", ")}`;
        }
      }

      // Count total documents
      const [countResult] = await pool.query(
        `SELECT COUNT(*) as count FROM ${tableName}${whereClause}`,
        whereParams,
      );

      const totalDocs = (countResult as any[])[0].count;

      // Query documents with pagination
      const [rows] = await pool.query(
        `SELECT * FROM ${tableName}${whereClause}${orderClause} LIMIT ? OFFSET ?`,
        [...whereParams, limit, offset],
      );

      // Format results
      let docs = Array.isArray(rows) ? (rows as T[]) : [];

      // Process relationships if depth > 0
      if (depth > 0) {
        const collectionConfig = collections[collection];
        docs = await Promise.all(
          docs.map(async (doc) => {
            return processDocumentRelationships(
              {
                client: pool,
                tables,
                collections,
                tablePrefix: prefix,
                tableNameMap,
              } as any,
              collection,
              collectionConfig?.fields || [],
              doc,
              depth,
              0,
            );
          }),
        );
      }

      // Calculate pagination metadata
      const totalPages = Math.ceil(totalDocs / limit);
      const hasPrevPage = page > 1;
      const hasNextPage = page < totalPages;

      return {
        docs,
        totalDocs,
        limit,
        totalPages,
        page,
        pagingCounter: offset + 1,
        hasPrevPage,
        hasNextPage,
        prevPage: hasPrevPage ? page - 1 : null,
        nextPage: hasNextPage ? page + 1 : null,
      };
    } catch (error) {
      console.error(`Error finding documents in ${collection}:`, error);
      throw error;
    }
  };

  // Find a single document
  const findOne = async <T extends TypeWithID = any>({
    collection,
    where,
    depth = 0,
    req,
  }: FindOneArgs): Promise<T> => {
    try {
      // Use the find method with limit 1
      const result = await find({
        collection,
        where,
        limit: 1,
        page: 1,
        depth,
        req,
      });

      if (result.docs.length === 0) {
        throw new Error(`Document not found in ${collection}`);
      }

      return result.docs[0];
    } catch (error) {
      console.error(`Error finding document in ${collection}:`, error);
      throw error;
    }
  };

  // Find a document by ID
  const findByID = async <T extends TypeWithID = any>({
    collection,
    id,
    depth = 0,
    req,
  }: {
    collection: string;
    id: string | number;
    depth?: number;
    req?: any;
  }): Promise<T> => {
    return findOne({
      collection,
      where: { id: { equals: id } },
      depth,
      req,
    });
  };

  // Create a document
  const create = async ({
    collection,
    data,
    req,
    draft = false,
  }: CreateArgs): Promise<any> => {
    try {
      const tableName =
        tableNameMap.get(collection) || `${prefix}${collection}`;
      const collectionConfig = collections[collection];

      // Process fields to separate relationship fields
      const { relationshipFields, normalFields } = processFields(
        collectionConfig?.fields,
      );

      // Extract fields for the main table
      const mainFields: Record<string, any> = {};
      const relationshipData: Record<string, any> = {};

      Object.entries(data).forEach(([key, value]) => {
        const fieldConfig = (collectionConfig?.fields || []).find(
          (f) => f.name === key,
        );

        if (fieldConfig && fieldConfig.type === "relationship") {
          relationshipData[key] = value;
        } else {
          mainFields[key] = value;
        }
      });

      // Create the main document
      const fieldNames = Object.keys(mainFields);
      const placeholders = fieldNames.map(() => "?").join(",");
      const values = Object.values(mainFields);

      if (fieldNames.length === 0) {
        fieldNames.push("id");
        placeholders.concat("DEFAULT");
      }

      const [result] = await pool.query(
        `INSERT INTO ${tableName} (${fieldNames.join(",")}) VALUES (${placeholders})`,
        values,
      );

      const insertId = (result as any).insertId;

      // Process relationships
      for (const field of relationshipFields) {
        const fieldName = field.name;
        const value = relationshipData[fieldName];

        if (value !== undefined && typeof field.relationTo === "string") {
          // Delete existing relationships
          const relationTableName = `${prefix}${collection}_${field.relationTo}_rels`;
          await pool.query(
            `DELETE FROM ${relationTableName} WHERE parentId = ?`,
            [insertId],
          );

          // Create new relationships
          if (value !== null) {
            await createRelationshipDrizzleTable({
              adapter: {
                client: pool,
                tables,
                tablePrefix: prefix,
                tableNameMap,
              } as any,
              fromCollection: collection,
              fromId: insertId,
              toCollection: field.relationTo,
              relationField: fieldName,
              value,
            });
          }
        }
      }

      // Return the created document
      return findByID({
        collection,
        id: insertId,
        depth: 0,
        req,
      });
    } catch (error) {
      console.error(`Error creating document in ${collection}:`, error);
      throw error;
    }
  };

  // Update a document
  const update = async ({
    collection,
    id,
    data,
    req,
  }: UpdateOneArgs): Promise<any> => {
    try {
      const tableName =
        tableNameMap.get(collection) || `${prefix}${collection}`;
      const collectionConfig = collections[collection];

      // Process fields to separate relationship fields
      const { relationshipFields, normalFields } = processFields(
        collectionConfig?.fields,
      );

      // Extract fields for the main table
      const mainFields: Record<string, any> = {};
      const relationshipData: Record<string, any> = {};

      Object.entries(data).forEach(([key, value]) => {
        const fieldConfig = (collectionConfig?.fields || []).find(
          (f) => f.name === key,
        );

        if (fieldConfig && fieldConfig.type === "relationship") {
          relationshipData[key] = value;
        } else {
          mainFields[key] = value;
        }
      });

      // Update the main document
      const fieldUpdates = Object.entries(mainFields).map(
        ([field, _]) => `${field} = ?`,
      );
      const values = Object.values(mainFields);

      if (fieldUpdates.length > 0) {
        await pool.query(
          `UPDATE ${tableName} SET ${fieldUpdates.join(", ")} WHERE id = ?`,
          [...values, id],
        );
      }

      // Process relationships
      for (const field of relationshipFields) {
        const fieldName = field.name;
        const value = relationshipData[fieldName];

        if (value !== undefined && typeof field.relationTo === "string") {
          // Delete existing relationships
          const relationTableName = `${prefix}${collection}_${field.relationTo}_rels`;
          await pool.query(
            `DELETE FROM ${relationTableName} WHERE parentId = ?`,
            [id],
          );

          // Create new relationships
          if (value !== null) {
            await createRelationshipDrizzleTable({
              adapter: {
                client: pool,
                tables,
                tablePrefix: prefix,
                tableNameMap,
              } as any,
              fromCollection: collection,
              fromId: id,
              toCollection: field.relationTo,
              relationField: fieldName,
              value,
            });
          }
        }
      }

      // Return the updated document
      return findByID({
        collection,
        id,
        depth: 0,
        req,
      });
    } catch (error) {
      console.error(`Error updating document in ${collection}:`, error);
      throw error;
    }
  };

  // Delete a document
  const deleteOne = async ({
    collection,
    id,
    req,
  }: DeleteOneArgs): Promise<void> => {
    try {
      const tableName =
        tableNameMap.get(collection) || `${prefix}${collection}`;
      const collectionConfig = collections[collection];

      // Process fields to separate relationship fields
      const { relationshipFields } = processFields(collectionConfig?.fields);

      // Delete relationships first
      for (const field of relationshipFields) {
        if (typeof field.relationTo === "string") {
          const relationTableName = `${prefix}${collection}_${field.relationTo}_rels`;

          await pool.query(
            `DELETE FROM ${relationTableName} WHERE parentId = ?`,
            [id],
          );
        }
      }

      // Delete the main document
      await pool.query(`DELETE FROM ${tableName} WHERE id = ?`, [id]);
    } catch (error) {
      console.error(`Error deleting document in ${collection}:`, error);
      throw error;
    }
  };

  // Initialize return object early to avoid "used before assigned" error
  const adapterObject: MySQLAdapter = {
    // MySQL pool and Drizzle instance
    client: null as unknown as Pool, // Will be set after connect
    db: null as any, // Will be set after connect
    tables,
    collections,
    tableNameMap,
    tablePrefix: prefix,

    // Connection methods
    connect: async () => {
      await connect();
      // Update the properties after connection
      adapterObject.client = pool;
      adapterObject.db = db as any;
    },
    disconnect,

    // Schema methods
    createCollection,

    // CRUD methods
    create,
    delete: deleteOne,
    find,
    findOne,
    findByID,
    update,

    // Relationship processing
    processRelationships: processDocumentRelationships as any,
  };

  return adapterObject;
};
