import { buildConfig } from "payload/config";

import { sqlAdapter } from "../src";

/**
 * Example PayloadCMS configuration using the SQL adapter
 */
export default buildConfig({
  // Your PayloadCMS collections
  collections: [
    {
      slug: "posts",
      fields: [
        {
          name: "title",
          type: "text",
          required: true,
        },
        {
          name: "content",
          type: "richText",
        },
        {
          name: "author",
          type: "relationship",
          relationTo: "users",
        },
        {
          name: "categories",
          type: "relationship",
          relationTo: "categories",
          hasMany: true,
        },
      ],
    },
    {
      slug: "users",
      auth: true, // Add authentication support
      fields: [
        {
          name: "name",
          type: "text",
        },
      ],
    },
    {
      slug: "categories",
      fields: [
        {
          name: "name",
          type: "text",
          required: true,
        },
      ],
    },
  ],

  // Configure SQL adapter
  db: sqlAdapter({
    // Connection info
    host: "localhost",
    user: "root",
    password: "rootpassword",
    database: "payload",

    // Optional configuration
    port: 3306,
    tablePrefix: "pl_",
    debug: true,

    // CAUTION: Setting this to true will drop all tables with the prefix
    // Only use for development or testing
    dropDatabase: false,
  }),

  // Other PayloadCMS config
  admin: {
    user: "users",
  },
  typescript: {
    outputFile: "payload-types.ts",
  },
});
