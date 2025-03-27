import {
  and,
  eq,
  gt,
  gte,
  inArray,
  like,
  lt,
  lte,
  not,
  notInArray,
  notLike,
  or,
  sql,
} from "drizzle-orm";

/**
 * NOTE: Unlike the native PayloadCMS adapters (which simply re-export all from drizzle-orm),
 * we're using explicit imports/exports for the following reasons:
 *
 * 1. To create a clear mapping between PayloadCMS operators and MySQL operators
 * 2. To handle MySQL-specific functionality (like ILIKE emulation)
 * 3. To ensure we only depend on the operators we actually need
 * 4. To make the relationship between our code and the ORM more maintainable
 */

// Re-export basic operators
export {
  and,
  eq,
  gt,
  gte,
  inArray,
  like,
  lt,
  lte,
  not,
  notInArray,
  notLike,
  or,
  sql,
};

// Export the operator map
export const operatorMap = {
  // Basic operators
  equals: eq,
  gt,
  gte,
  lt,
  lte,

  // Array operators
  in: inArray,
  not_in: notInArray,

  // String operators
  like,
  not_like: notLike,
  // Note: MySQL doesn't have ILIKE, this is handled elsewhere with LOWER()

  // Logical operators
  and,
  or,
};
