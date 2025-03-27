import type { Field, MySQLAdapter, TypeWithID } from "../types";
import type { OkPacket, ResultSetHeader, RowDataPacket } from "mysql2";
import { eq, inArray, sql } from "drizzle-orm";

import type { MySqlTable } from "drizzle-orm/mysql-core";

/**
 * Relationship field type definition
 */
interface RelationshipField {
  type: "relationship";
  relationTo: string | string[];
  hasMany?: boolean;
  name: string;
}

/**
 * Basic relation type
 */
interface Relation {
  childId: number;
  order: number;
}

/**
 * MySQL row result with ID
 */
interface RowWithID extends RowDataPacket {
  id: string | number;
  [key: string]: any;
}

/**
 * Converts a MySQL result to TypeWithID
 */
function toTypeWithID(
  row: RowDataPacket | OkPacket | ResultSetHeader | RowDataPacket[],
): TypeWithID | null {
  if (!row) return null;

  // Handle array result - take first item
  if (Array.isArray(row)) {
    return row.length > 0 ? toTypeWithID(row[0]) : null;
  }

  // Check if row has id
  if ("id" in row) {
    return row as TypeWithID;
  }

  return null;
}

/**
 * Fetches related documents for a specific field
 */
export async function fetchRelations<T extends TypeWithID = any>(
  adapter: MySQLAdapter,
  collection: string,
  field: Field,
  doc: T,
  depth: number = 0,
  currentDepth: number = 0,
): Promise<any> {
  // If we've reached the maximum depth, return just IDs
  if (currentDepth >= depth) {
    return doc[field.name];
  }

  // If no data exists for this field, return null/empty
  if (!doc[field.name]) {
    return field.hasMany ? [] : null;
  }

  // Get relation information
  const relationTo = field.relationTo;
  const ids = Array.isArray(doc[field.name])
    ? doc[field.name]
    : [doc[field.name]];

  // If no IDs, return empty result
  if (!ids.length) {
    return field.hasMany ? [] : null;
  }

  // Handle single relationTo
  if (typeof relationTo === "string") {
    // Fetch all related documents
    const placeholders = ids.map(() => "?").join(",");
    const tableName = adapter.tableNameMap.get(relationTo) || relationTo;

    // Query for related documents
    const [rows] = (await adapter.client.query(
      `SELECT * FROM ${tableName} WHERE id IN (${placeholders})`,
      ids,
    )) as [RowDataPacket[], any];

    // Format and process each document
    const relatedDocs = Array.isArray(rows) ? rows : [];

    if (field.hasMany) {
      // Process each document and maintain order
      const docsById: Record<string | number, TypeWithID> = {};

      for (const relatedDoc of relatedDocs as RowWithID[]) {
        if (!("id" in relatedDoc)) continue;

        // Process nested relationships if needed
        let processedDoc: TypeWithID = relatedDoc as TypeWithID;
        if (depth > 0) {
          processedDoc = await processDocumentRelationships(
            adapter,
            relationTo,
            adapter.collections[relationTo]?.fields || [],
            processedDoc,
            depth,
            currentDepth + 1,
          );
        }
        docsById[relatedDoc.id] = processedDoc;
      }

      // Maintain the original order
      return ids.map((id: string | number) => docsById[id]).filter(Boolean);
    } else {
      // Single relation - return the first matching document
      const relatedDoc = relatedDocs[0] as RowWithID;
      if (!relatedDoc || !("id" in relatedDoc)) return null;

      // Process nested relationships if needed
      if (depth > 0) {
        return processDocumentRelationships(
          adapter,
          relationTo,
          adapter.collections[relationTo]?.fields || [],
          relatedDoc as TypeWithID,
          depth,
          currentDepth + 1,
        );
      }

      return relatedDoc;
    }
  }

  // Multi-collection relationTo is not implemented yet
  return doc[field.name];
}

/**
 * Processes all relationship fields in a document
 */
export async function processDocumentRelationships<T extends TypeWithID = any>(
  adapter: MySQLAdapter,
  collection: string,
  fields: Field[],
  doc: T,
  depth: number = 0,
  currentDepth: number = 0,
): Promise<T> {
  if (!doc) return doc;

  // Clone document to avoid modifying the original
  const result = { ...doc } as Record<string, any>;

  // Find and process all relationship fields
  const relationshipFields = fields.filter(
    (field) => field.type === "relationship",
  );

  // Process each relationship field
  for (const field of relationshipFields) {
    if (!field.name || !doc[field.name]) continue;

    // Fetch related documents
    const relatedData = await fetchRelations(
      adapter,
      collection,
      field,
      doc,
      depth,
      currentDepth,
    );

    // Set the related data on the result object
    result[field.name] = relatedData;
  }

  return result as T;
}
