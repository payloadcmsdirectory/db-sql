import { sql } from "drizzle-orm";

import type { MySQLAdapter } from "../types.js";

export function createJSONQuery(
  this: MySQLAdapter,
  path: string[],
  operator: string,
  value: any,
): { query: string; params: any[] } {
  // For MySQL, we use JSON_EXTRACT for path-based queries
  const jsonPath = path.map((segment) => `$.${segment}`).join(".");
  const params = [];

  // Adjust value based on operator and type
  let adjustedValue = value;
  if (typeof value === "object" && value !== null) {
    adjustedValue = JSON.stringify(value);
  }

  switch (operator) {
    case "equals":
      return {
        query: `JSON_EXTRACT(data, ?) = ?`,
        params: [jsonPath, adjustedValue],
      };

    case "not_equals":
      return {
        query: `JSON_EXTRACT(data, ?) != ? OR JSON_EXTRACT(data, ?) IS NULL`,
        params: [jsonPath, adjustedValue, jsonPath],
      };

    case "exists":
      return {
        query: value
          ? `JSON_EXTRACT(data, ?) IS NOT NULL`
          : `JSON_EXTRACT(data, ?) IS NULL`,
        params: [jsonPath],
      };

    case "contains":
      return {
        query: `JSON_EXTRACT(data, ?) LIKE ?`,
        params: [jsonPath, `%${adjustedValue}%`],
      };

    case "in":
      if (Array.isArray(value)) {
        const placeholders = value.map(() => "?").join(", ");
        return {
          query: `JSON_EXTRACT(data, ?) IN (${placeholders})`,
          params: [jsonPath, ...value],
        };
      }
      return {
        query: "FALSE",
        params: [],
      };

    case "not_in":
      if (Array.isArray(value)) {
        const placeholders = value.map(() => "?").join(", ");
        return {
          query: `JSON_EXTRACT(data, ?) NOT IN (${placeholders}) OR JSON_EXTRACT(data, ?) IS NULL`,
          params: [jsonPath, ...value, jsonPath],
        };
      }
      return {
        query: "TRUE",
        params: [],
      };

    case "greater_than":
      return {
        query: `JSON_EXTRACT(data, ?) > ?`,
        params: [jsonPath, adjustedValue],
      };

    case "greater_than_equal":
      return {
        query: `JSON_EXTRACT(data, ?) >= ?`,
        params: [jsonPath, adjustedValue],
      };

    case "less_than":
      return {
        query: `JSON_EXTRACT(data, ?) < ?`,
        params: [jsonPath, adjustedValue],
      };

    case "less_than_equal":
      return {
        query: `JSON_EXTRACT(data, ?) <= ?`,
        params: [jsonPath, adjustedValue],
      };

    default:
      return {
        query: "FALSE",
        params: [],
      };
  }
}
