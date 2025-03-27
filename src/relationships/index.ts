/**
 * NOTE: Unlike the native PayloadCMS adapters which leverage database-specific features,
 * our MySQL adapter requires dedicated relationship handling for several reasons:
 *
 * 1. MySQL requires explicit junction tables for many-to-many relationships
 * 2. We need custom query building to efficiently fetch related documents
 * 3. Relationship depth handling requires specialized processing
 * 4. This separation of concerns makes the code more maintainable
 *
 * The native adapters (SQLite, PostgreSQL) benefit from tighter integration with
 * the Drizzle ORM and specific database features, while our implementation needs
 * to be more explicit to handle MySQL's relationship patterns.
 */

export {
  buildRelationshipTable,
  createRelationshipDrizzleTable,
} from "./buildRelationshipTable";
export {
  fetchRelations,
  processDocumentRelationships,
} from "./queryRelationships";
